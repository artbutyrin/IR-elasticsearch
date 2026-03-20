from fastapi import FastAPI

from .routers.health import router as health_router
from .routers.movies import router as movies_router

app = FastAPI(title="IR Elasticsearch Demo API")

app.include_router(health_router)
app.include_router(movies_router)
