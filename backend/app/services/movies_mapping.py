"""Elasticsearch index mapping for TMDB-style movie documents."""


def movies_index_mappings() -> dict:
    return {
        "properties": {
            "id": {"type": "integer"},
            "title": {"type": "text"},
            "original_title": {"type": "text"},
            "overview": {"type": "text"},
            "keywords": {"type": "text"},
            "genres": {"type": "text"},
            "genres_list": {"type": "keyword"},
            "original_language": {"type": "keyword"},
            "release_date": {"type": "date", "ignore_malformed": True},
            "year": {"type": "integer"},
            "vote_average": {"type": "float"},
            "vote_count": {"type": "integer"},
            "poster_path": {"type": "keyword", "ignore_above": 256},
            "imdb_id": {"type": "keyword"},
            "runtime": {"type": "integer"},
            "status": {"type": "keyword"},
            # Legacy demo seed (small JSON) — keep compatible fields
            "description": {"type": "text"},
            "genre": {"type": "keyword"},
            "rating": {"type": "float"},
            "title_keyword": {"type": "keyword"},
        }
    }
