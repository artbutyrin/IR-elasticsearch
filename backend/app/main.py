import os

from elasticsearch import Elasticsearch
from fastapi import FastAPI

app = FastAPI(title="IR Elasticsearch Demo API")

es_url = os.getenv("ELASTICSEARCH_URL", "http://localhost:9200")
es_client = Elasticsearch(es_url)


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/es-health")
def elasticsearch_health():
    return {"elasticsearch_reachable": es_client.ping(), "url": es_url}
