import csv
import json
import logging
import os
import tempfile
from pathlib import Path
from typing import Any, BinaryIO

from elasticsearch.helpers import bulk

from ..core.config import MOVIES_INDEX
from ..core.es_client import es_client
from .movies_mapping import movies_index_mappings


logger = logging.getLogger(__name__)

seed_path = Path(__file__).resolve().parent.parent / "movies_seed.json"

BULK_CHUNK = 800

MAX_RESULT_WINDOW = 1_000_000
DEFAULT_PAGE_SIZE = 24
MAX_PAGE_SIZE = 50


def _safe_int(value: str | None, default: int | None = None) -> int | None:
    if value is None or value == "":
        return default
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return default


def _parse_tmdb_bool(value: object) -> bool | None:

    if value is None:
        return None
    s = str(value).strip().lower()
    if s in ("true", "t", "1", "yes"):
        return True
    if s in ("false", "f", "0", "no", ""):
        return False
    return None


def _safe_float(value: str | None, default: float | None = None) -> float | None:
    if value is None or value == "":
        return default
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _index_settings() -> dict[str, Any]:
    return {"index": {"max_result_window": MAX_RESULT_WINDOW}}


def _recreate_index() -> None:
    if es_client.indices.exists(index=MOVIES_INDEX):
        es_client.indices.delete(index=MOVIES_INDEX)
    es_client.indices.create(
        index=MOVIES_INDEX,
        mappings=movies_index_mappings(),
        settings=_index_settings(),
    )


def ensure_movies_index_search_settings() -> None:
    """
    Apply max_result_window on existing indices (e.g. Docker volume) so pagination works past ES default 10k.
    """
    if not es_client.indices.exists(index=MOVIES_INDEX):
        return
    try:
        es_client.indices.put_settings(index=MOVIES_INDEX, settings=_index_settings())
    except Exception as exc:
        logger.warning("Could not update %s max_result_window: %s", MOVIES_INDEX, exc)


def tmdb_row_to_doc(row: dict) -> dict | None:

    title = (row.get("title") or "").strip()
    if not title:
        return None

    genres_raw = (row.get("genres") or "").strip()
    genres_list = [g.strip() for g in genres_raw.split(",") if g.strip()]

    release_date = (row.get("release_date") or "").strip()
    year = None
    if len(release_date) >= 4 and release_date[:4].isdigit():
        year = int(release_date[:4])

    poster = (row.get("poster_path") or "").strip()

    doc: dict = {
        "id": _safe_int(row.get("id")),
        "title": title,
        "original_title": (row.get("original_title") or "").strip(),
        "overview": (row.get("overview") or "").strip(),
        "keywords": (row.get("keywords") or "").strip(),
        "genres": genres_raw,
        "genres_list": genres_list,
        "original_language": (row.get("original_language") or "").strip(),
        "year": year,
        "vote_average": _safe_float(row.get("vote_average"), 0.0) or 0.0,
        "vote_count": _safe_int(row.get("vote_count"), 0) or 0,
        "poster_path": poster,
        "imdb_id": (row.get("imdb_id") or "").strip(),
        "runtime": _safe_int(row.get("runtime")),
        "status": (row.get("status") or "").strip(),
        "title_keyword": title,
    }

    if release_date:
        doc["release_date"] = release_date

    return doc


def import_tmdb_csv_stream(file_obj: BinaryIO) -> dict:

    _recreate_index()

    text_stream = _utf8_text_stream(file_obj)
    reader = csv.DictReader(text_stream)

    if reader.fieldnames is None:
        raise ValueError("CSV has no header row")

    normalized_headers = {h.strip().lstrip("\ufeff") for h in reader.fieldnames if h}
    if "title" not in normalized_headers:
        raise ValueError("CSV must include a 'title' column")

    batch: list[dict] = []
    total_rows = 0
    indexed = 0
    skipped = 0

    for row in reader:
        total_rows += 1
        row = {(k or "").lstrip("\ufeff").strip(): v for k, v in row.items()}

        doc = tmdb_row_to_doc(row)
        if not doc:
            skipped += 1
            continue

        batch.append({"_index": MOVIES_INDEX, "_source": doc})
        if len(batch) >= BULK_CHUNK:
            ok, _ = bulk(es_client, batch)
            indexed += ok
            batch.clear()

    if batch:
        ok, _ = bulk(es_client, batch)
        indexed += ok

    es_client.indices.refresh(index=MOVIES_INDEX)
    return {
        "index": MOVIES_INDEX,
        "rows_read": total_rows,
        "indexed_documents": indexed,
        "skipped_rows": skipped,
    }


def _utf8_text_stream(file_obj: BinaryIO, encoding: str = "utf-8-sig"):
    import io

    return io.TextIOWrapper(file_obj, encoding=encoding, newline="")


def import_tmdb_csv_from_path(path: str) -> dict:

    with open(path, "rb") as handle:
        return import_tmdb_csv_stream(handle)


def import_tmdb_csv_from_upload(temp_path: str) -> dict:

    return import_tmdb_csv_from_path(temp_path)


def seed_movies_index() -> dict:
    with seed_path.open("r", encoding="utf-8") as file:
        movies = json.load(file)

    _recreate_index()

    actions = []
    for movie in movies:
        title = movie.get("title", "")
        genre = movie.get("genre", "")
        actions.append(
            {
                "_index": MOVIES_INDEX,
                "_source": {
                    "title": title,
                    "title_keyword": title,
                    "original_title": title,
                    "overview": movie.get("description", ""),
                    "description": movie.get("description", ""),
                    "genres": genre,
                    "genres_list": [genre] if genre else [],
                    "year": movie.get("year"),
                    "vote_average": movie.get("rating"),
                    "rating": movie.get("rating"),
                    "genre": genre,
                    "keywords": "",
                    "adult": False,
                },
            }
        )

    success, _ = bulk(es_client, actions)
    es_client.indices.refresh(index=MOVIES_INDEX)

    return {"indexed_documents": success, "index": MOVIES_INDEX}


MULTI_MATCH_FIELDS = [
    "title^3",
    "original_title^2",
    "overview",
    "keywords^1.5",
    "genres",
    "description^2",
]


def _genre_year_filters(
    genre: str | None,
    year_from: int | None,
    year_to: int | None,
) -> list:
    filters: list = []
    if genre:
        filters.append(
            {
                "bool": {
                    "should": [
                        {"term": {"genres_list": genre}},
                        {"term": {"genre": genre}},
                        {"match": {"genres": {"query": genre, "operator": "and"}}},
                    ],
                    "minimum_should_match": 1,
                }
            }
        )
    if year_from is not None or year_to is not None:
        range_query: dict = {}
        if year_from is not None:
            range_query["gte"] = year_from
        if year_to is not None:
            range_query["lte"] = year_to
        filters.append({"range": {"year": range_query}})
    return filters


def _bool_query(
    must: list,
    genre: str | None,
    year_from: int | None,
    year_to: int | None,
    exclude_adult: bool,
) -> dict:
    filters = _genre_year_filters(genre, year_from, year_to)

    if exclude_adult:
        filters.append({"bool": {"must_not": [{"term": {"adult": True}}]}})
    return {"bool": {"must": must, "filter": filters}}


def _multi_match_must_clause(query_text: str, use_fuzzy: bool) -> list:
    if not query_text:
        return [{"match_all": {}}]
    mm: dict = {
        "query": query_text,
        "fields": MULTI_MATCH_FIELDS,
        "type": "best_fields",
    }
    if use_fuzzy:
        mm["fuzziness"] = "AUTO"
    else:
        mm["fuzziness"] = 0
    return [{"multi_match": mm}]


def _match_phrase_must_clause(query_text: str) -> list:
    if not query_text:
        return [{"match_all": {}}]
    return [{"match_phrase": {"title": query_text}}]


def _normalize_hit(hit: dict) -> dict:
    item = hit["_source"]
    item["_score"] = hit["_score"]
    item["highlight"] = hit.get("highlight", {})
    if "overview" in item and not item.get("description"):
        item["description"] = item["overview"]
    if item.get("vote_average") is not None and item.get("rating") is None:
        item["rating"] = item["vote_average"]
    if item.get("genres") and not item.get("genre"):
        item["genre"] = str(item["genres"]).split(",")[0].strip()
    return item


HIGHLIGHT_CONFIG = {
    "fields": {
        "title": {},
        "original_title": {},
        "overview": {},
        "description": {},
    },
    "pre_tags": ["<mark>"],
    "post_tags": ["</mark>"],
}


def _hits_total_value(response: dict) -> int:
    total = response["hits"]["total"]
    if isinstance(total, dict):
        return int(total.get("value", 0))
    return int(total)


def _execute_search(
    root_query: dict,
    from_offset: int,
    page_size: int,
    *,
    with_highlight: bool = True,
) -> tuple[list, int]:
    kw: dict = {
        "index": MOVIES_INDEX,
        "query": root_query,
        "from_": from_offset,
        "size": page_size,
        "track_total_hits": True,
    }
    if with_highlight:
        kw["highlight"] = HIGHLIGHT_CONFIG
    response = es_client.search(**kw)
    results = [_normalize_hit(h) for h in response["hits"]["hits"]]
    total_val = _hits_total_value(response)
    return results, total_val


def search_movies(
    query_text: str = "",
    genre: str | None = None,
    year_from: int | None = None,
    year_to: int | None = None,
    page: int = 1,
    page_size: int = DEFAULT_PAGE_SIZE,
    *,
    fuzzy: bool = True,
    exclude_adult: bool = False,
) -> dict:
    must = _multi_match_must_clause(query_text, use_fuzzy=fuzzy)
    root = _bool_query(must, genre, year_from, year_to, exclude_adult)

    page = max(1, page)
    page_size = max(1, min(page_size, MAX_PAGE_SIZE))
    from_offset = (page - 1) * page_size
    if from_offset + page_size > MAX_RESULT_WINDOW:
        from_offset = max(0, MAX_RESULT_WINDOW - page_size)

    results, total_val = _execute_search(root, from_offset, page_size)
    total_pages = (total_val + page_size - 1) // page_size if total_val else 0

    return {
        "total": total_val,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "results": results,
    }


def _hit_preview(doc: dict) -> dict:
    return {
        "id": doc.get("id"),
        "title": doc.get("title") or "",
        "year": doc.get("year"),
        "score": doc.get("_score"),
    }


def compare_query_modes(
    query_text: str,
    genre: str | None = None,
    year_from: int | None = None,
    year_to: int | None = None,
    *,
    top_n: int = 8,
    fuzzy: bool = True,
    exclude_adult: bool = False,
) -> dict:

    top_n = max(1, min(top_n, MAX_PAGE_SIZE))

    must_fuzzy = _multi_match_must_clause(query_text, use_fuzzy=fuzzy)
    q_fuzzy = _bool_query(must_fuzzy, genre, year_from, year_to, exclude_adult)

    must_phrase = _match_phrase_must_clause(query_text)
    q_phrase = _bool_query(must_phrase, genre, year_from, year_to, exclude_adult)

    hits_fuzzy, total_fuzzy = _execute_search(q_fuzzy, 0, top_n, with_highlight=False)
    hits_phrase, total_phrase = _execute_search(q_phrase, 0, top_n, with_highlight=False)

    fuzzy_on = "fuzziness: AUTO (typo-tolerant)" if fuzzy else "fuzziness: 0 (exact tokens only)"

    return {
        "q": query_text,
        "filters_note": "Same genre/year/adult filters applied to both sides when set.",
        "multi_match_side": {
            "label": "multi_match (best_fields)",
            "description": f"Several analyzed text fields; {fuzzy_on}.",
            "elasticsearch_query": q_fuzzy,
            "total": total_fuzzy,
            "top_hits": [_hit_preview(h) for h in hits_fuzzy],
        },
        "match_phrase_side": {
            "label": "match_phrase (title)",
            "description": "Exact phrase in the title field only — no fuzziness; typos usually miss.",
            "elasticsearch_query": q_phrase,
            "total": total_phrase,
            "top_hits": [_hit_preview(h) for h in hits_phrase],
        },
    }
