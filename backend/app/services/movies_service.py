import json
from pathlib import Path

from elasticsearch.helpers import bulk

from ..core.config import MOVIES_INDEX
from ..core.es_client import es_client


seed_path = Path(__file__).resolve().parent.parent / "movies_seed.json"


def seed_movies_index() -> dict:
    with seed_path.open("r", encoding="utf-8") as file:
        movies = json.load(file)

    mappings = {
        "properties": {
            "title": {"type": "text"},
            "title_keyword": {"type": "keyword"},
            "description": {"type": "text"},
            "genre": {"type": "keyword"},
            "year": {"type": "integer"},
            "rating": {"type": "float"},
        }
    }

    if es_client.indices.exists(index=MOVIES_INDEX):
        es_client.indices.delete(index=MOVIES_INDEX)

    es_client.indices.create(index=MOVIES_INDEX, mappings=mappings)

    actions = [
        {
            "_index": MOVIES_INDEX,
            "_source": {**movie, "title_keyword": movie["title"]},
        }
        for movie in movies
    ]

    success, _ = bulk(es_client, actions)
    es_client.indices.refresh(index=MOVIES_INDEX)

    return {"indexed_documents": success, "index": MOVIES_INDEX}


def search_movies(
    query_text: str = "",
    genre: str | None = None,
    year_from: int | None = None,
    year_to: int | None = None,
) -> dict:
    must = []
    filters = []

    if query_text:
        must.append(
            {
                "multi_match": {
                    "query": query_text,
                    "fields": ["title^3", "description"],
                    "fuzziness": "AUTO",
                }
            }
        )
    else:
        must.append({"match_all": {}})

    if genre:
        filters.append({"term": {"genre": genre}})

    if year_from is not None or year_to is not None:
        range_query = {}
        if year_from is not None:
            range_query["gte"] = year_from
        if year_to is not None:
            range_query["lte"] = year_to
        filters.append({"range": {"year": range_query}})

    response = es_client.search(
        index=MOVIES_INDEX,
        query={"bool": {"must": must, "filter": filters}},
        highlight={"fields": {"title": {}, "description": {}}},
        size=10,
    )

    results = []
    for hit in response["hits"]["hits"]:
        item = hit["_source"]
        item["_score"] = hit["_score"]
        item["highlight"] = hit.get("highlight", {})
        results.append(item)

    return {"total": response["hits"]["total"]["value"], "results": results}
