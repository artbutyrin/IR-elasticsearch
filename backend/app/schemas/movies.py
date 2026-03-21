from pydantic import BaseModel, ConfigDict


class MovieResult(BaseModel):
    """Flexible shape: TMDB import uses overview/vote_average/genres_list; seed uses description/rating/genre."""

    model_config = ConfigDict(extra="allow")

    title: str = ""
    year: int | None = None
    genre: str | None = None
    rating: float | None = None
    description: str | None = None
    # _score, highlight, overview, vote_average, poster_path, etc. are kept via extra="allow"


class SearchResponse(BaseModel):
    total: int
    page: int = 1
    page_size: int = 20
    total_pages: int = 0
    results: list[MovieResult]
