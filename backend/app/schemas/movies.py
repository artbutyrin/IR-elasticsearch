from pydantic import BaseModel, Field

class MovieResult(BaseModel):
    title: str
    year: int
    genre: str
    rating: float
    description: str
    _score: float | None = None
    highlight: dict = Field(default_factory=dict)

class SearchResponse(BaseModel):
    total: int
    results: list[MovieResult]
