import csv
import json
import os
import tempfile
from pathlib import Path
from typing import BinaryIO

from elasticsearch.helpers import bulk

from ..core.config import MOVIES_INDEX
from ..core.es_client import es_client
from .movies_mapping import movies_index_mappings


seed_path = Path(__file__).resolve().parent.parent / "movies_seed.json"

BULK_CHUNK = 800
# Elasticsearch default max result window (from + size must stay within this)
MAX_RESULT_WINDOW = 10000
DEFAULT_PAGE_SIZE = 24
MAX_PAGE_SIZE = 50


def _safe_int(value: str | None, default: int | None = None) -> int | None:
    if value is None or value == "":
        return default
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return default


def _safe_float(value: str | None, default: float | None = None) -> float | None:
    if value is None or value == "":
        return default
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _recreate_index() -> None:
    if es_client.indices.exists(index=MOVIES_INDEX):
        es_client.indices.delete(index=MOVIES_INDEX)
    es_client.indices.create(index=MOVIES_INDEX, mappings=movies_index_mappings())


def tmdb_row_to_doc(row: dict) -> dict | None:
    """Map one TMDB CSV row to an Elasticsearch document."""
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
    """
    Stream-read a TMDB CSV and bulk-index documents (does not load full file into RAM).
    Expects columns: id, title, vote_average, release_date, overview, genres, keywords, etc.
    """
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

    # utf-8-sig strips BOM so DictReader gets clean column names
    return io.TextIOWrapper(file_obj, encoding=encoding, newline="")


def import_tmdb_csv_from_path(path: str) -> dict:
    """Read CSV from disk (streaming, low memory)."""
    with open(path, "rb") as handle:
        return import_tmdb_csv_stream(handle)


def import_tmdb_csv_from_upload(temp_path: str) -> dict:
    """Read CSV from a temp file path (file already saved on disk)."""
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
                },
            }
        )

    success, _ = bulk(es_client, actions)
    es_client.indices.refresh(index=MOVIES_INDEX)

    return {"indexed_documents": success, "index": MOVIES_INDEX}


def search_movies(
    query_text: str = "",
    genre: str | None = None,
    year_from: int | None = None,
    year_to: int | None = None,
    page: int = 1,
    page_size: int = DEFAULT_PAGE_SIZE,
) -> dict:
    must: list = []
    filters: list = []

    if query_text:
        must.append(
            {
                "multi_match": {
                    "query": query_text,
                    "fields": [
                        "title^3",
                        "original_title^2",
                        "overview",
                        "keywords^1.5",
                        "genres",
                        "description^2",
                    ],
                    "fuzziness": "AUTO",
                    "type": "best_fields",
                }
            }
        )
    else:
        must.append({"match_all": {}})

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

    page = max(1, page)
    page_size = max(1, min(page_size, MAX_PAGE_SIZE))
    from_offset = (page - 1) * page_size
    if from_offset + page_size > MAX_RESULT_WINDOW:
        from_offset = max(0, MAX_RESULT_WINDOW - page_size)

    response = es_client.search(
        index=MOVIES_INDEX,
        query={"bool": {"must": must, "filter": filters}},
        highlight={
            "fields": {
                "title": {},
                "original_title": {},
                "overview": {},
                "description": {},
            },
            "pre_tags": ["<mark>"],
            "post_tags": ["</mark>"],
        },
        from_=from_offset,
        size=page_size,
    )

    results = []
    for hit in response["hits"]["hits"]:
        item = hit["_source"]
        item["_score"] = hit["_score"]
        item["highlight"] = hit.get("highlight", {})
        # Normalize for clients that still expect description / rating / genre
        if "overview" in item and not item.get("description"):
            item["description"] = item["overview"]
        if item.get("vote_average") is not None and item.get("rating") is None:
            item["rating"] = item["vote_average"]
        if item.get("genres") and not item.get("genre"):
            item["genre"] = str(item["genres"]).split(",")[0].strip()

        results.append(item)

    total_val = response["hits"]["total"]["value"]
    total_pages = (total_val + page_size - 1) // page_size if total_val else 0

    return {
        "total": total_val,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "results": results,
    }
