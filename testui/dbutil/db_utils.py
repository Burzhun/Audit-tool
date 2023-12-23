import json
import os
from contextlib import contextmanager

import pymongo
import requests


@contextmanager
def connect_to_mongo():
    client = pymongo.MongoClient(os.getenv("DB_CREDS"))
    db = client[os.getenv("DB_NAME")]
    yield db
    client.close()


def find_docs_in_collection(collection_name, req, find_one=True, action_find=True):
    with connect_to_mongo() as db:
        if action_find:
            if req and find_one:
                found = db[collection_name].find_one(req)
            elif req and not find_one:
                found = list(db[collection_name].find(req))
            else:
                found = list(db[collection_name].find(no_cursor_timeout=True).batch_size(50))
        else:
            found = db[collection_name].aggregate(req)
        return found


def delete_mongo(collection_name, req, delete_one=True):
    with connect_to_mongo() as db:
        if req and delete_one:
            db[collection_name].delete_one(req)
        elif req and not delete_one:
            db[collection_name].delete_many(req)
        else:
            db[collection_name].delete_many({})


def insert_mongo(collection_name, req, insert_one=False):
    with connect_to_mongo() as db:
        if insert_one:
            db[collection_name].insert_one(req)
        else:
            db[collection_name].insert_many(req)


def update_mongo(collection_name, find_req, update_req, update_one=True):
    with connect_to_mongo() as db:
        if update_one:
            db[collection_name].update_one(find_req, update_req)
        else:
            db[collection_name].update(find_req, update_req)


def copy_collection_to_another_mongo(collection_from, collection_to):
    with connect_to_mongo() as db:
        db[collection_from].aggregate([{"$match": {}},
                                       {"$out": collection_to}
                                       ])


def count_docs_mongo(collection_name, req):
    with connect_to_mongo() as db:
        return db[collection_name].count_documents(req)


def get_elk_logs(dt):
    headers = {
        'Content-Type': 'application/json',
        'kbn-xsrf': 'true',
        'kbn-name': 'kibana'
    }
    params = json.dumps({"version": True, "size": 500, "sort": [{"@timestamp": {"order": "desc"}}], "query": {
        "bool": {"must": [], "filter": [
            {"bool": {"should": [{"match": {"application_stack": os.getenv("KIBANA_SOURCE")}}],
                      "minimum_should_match": 1}},
            {"range": {"audit_timestamp": {"gte": dt}}},
            {"match_phrase": {"user": "a1@getnada.com"}}], "should": [], "must_not": []}}})

    return requests.post(
        f"https://{os.getenv('ELK_URL')}/elasticsearch/logstash-*/_search?rest_total_hits_as_int=true&ignore_unavailable=true&ignore_throttled=true&preference=1597735807954&timeout=30000ms",
        headers=headers, data=params, auth=(os.getenv("ELK_USER"), os.getenv("ELK_PSWD")), verify=False).json()[
        "hits"]["hits"]
