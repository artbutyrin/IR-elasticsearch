from fastapi import APIRouter, Query

from ..schemas.movies import SearchResponse
from ..services.movies_service import search_movies, seed_movies_index


router = APIRouter(tags=["movies"])

@router.post("/seed-movies")
def seed_movies() -> dict:
    return seed_movies_index()

@router.get("/search", response_model=SearchResponse)
def search(
    q: str = Query(default=""),
    genre: str | None = Query(default=None),
    year_from: int | None = Query(default=None),
    year_to: int | None = Query(default=None),
) -> dict:
    return search_movies(query_text=q, genre=genre, year_from=year_from, year_to=year_to)
