from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers.health import router as health_router
from .routers.movies import router as movies_router
from .services.movies_service import ensure_movies_index_search_settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    ensure_movies_index_search_settings()
    yield


app = FastAPI(title="IR Elasticsearch Demo API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(movies_router)
