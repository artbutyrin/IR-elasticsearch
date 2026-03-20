from elasticsearch import Elasticsearch

from .config import ELASTICSEARCH_URL

es_client = Elasticsearch(ELASTICSEARCH_URL)
