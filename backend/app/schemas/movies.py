from pydantic import BaseModel, ConfigDict


class MovieResult(BaseModel):

    model_config = ConfigDict(extra="allow")

    title: str = ""
    year: int | None = None
    genre: str | None = None
    rating: float | None = None
    description: str | None = None


class SearchResponse(BaseModel):
    total: int
    page: int = 1
    page_size: int = 20
    total_pages: int = 0
    results: list[MovieResult]
