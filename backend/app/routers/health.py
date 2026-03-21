from fastapi import APIRouter

from ..core.config import ELASTICSEARCH_URL
from ..core.es_client import es_client

router = APIRouter(tags=["health"])

@router.get("/health")
def health_check() -> dict:
    return {"status": "ok"}

@router.get("/es-health")
def elasticsearch_health() -> dict:
    return {"elasticsearch_reachable": es_client.ping(), "url": ELASTICSEARCH_URL}
