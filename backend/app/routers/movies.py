import os
import tempfile

from fastapi import APIRouter, File, HTTPException, Query, Response, UploadFile

from ..schemas.movies import SearchResponse
from ..services.movies_service import (
    import_tmdb_csv_from_upload,
    search_movies,
    seed_movies_index,
)


router = APIRouter(tags=["movies"])


@router.post("/seed-movies")
def seed_movies() -> dict:
    return seed_movies_index()


@router.post("/import-tmdb-csv")
async def import_tmdb_csv(file: UploadFile = File(...)) -> dict:
    """Upload TMDB CSV (streaming write to temp file; index in chunks)."""
    filename = (file.filename or "").lower()
    if not filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Expected a .csv file")

    fd, tmp_path = tempfile.mkstemp(suffix=".csv")
    os.close(fd)
    try:
        with open(tmp_path, "wb") as out:
            while True:
                chunk = await file.read(1024 * 1024)
                if not chunk:
                    break
                out.write(chunk)
        return import_tmdb_csv_from_upload(tmp_path)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass


@router.get("/search", response_model=SearchResponse)
def search(
    response: Response,
    q: str = Query(default=""),
    genre: str | None = Query(default=None),
    year_from: int | None = Query(default=None),
    year_to: int | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=24, ge=1, le=50),
) -> dict:
    # Avoid stale paginated responses from proxies or aggressive browser caches.
    response.headers["Cache-Control"] = "no-store"
    return search_movies(
        query_text=q,
        genre=genre,
        year_from=year_from,
        year_to=year_to,
        page=page,
        page_size=page_size,
    )
