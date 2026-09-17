"""
ForecastGuard AI — Database Client & Connection Manager
Connects to MongoDB using PyMongo with automatic fallback to persistent local storage.
"""

import os
import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional
import pymongo
from pymongo.collection import Collection
from pymongo.database import Database

logger = logging.getLogger("forecastguard.db")

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("MONGO_DB_NAME", "forecastguard")
LOCAL_STORE_PATH = Path(os.getenv("LOCAL_MONGO_STORE", "data/real_time_data.json"))


class PersistentFileCollection:
    """
    Fallback implementation of PyMongo Collection interface for environments
    where a live MongoDB daemon is not currently active.
    Persists documents to disk as JSON for cross-process access.
    """

    def __init__(self, file_path: Path):
        self.file_path = file_path
        self.file_path.parent.mkdir(parents=True, exist_ok=True)
        if not self.file_path.exists():
            self._write([])

    def _read(self) -> List[Dict[str, Any]]:
        try:
            if not self.file_path.exists():
                return []
            with open(self.file_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error reading local document store {self.file_path}: {e}")
            return []

    def _write(self, docs: List[Dict[str, Any]]) -> None:
        try:
            with open(self.file_path, "w", encoding="utf-8") as f:
                json.dump(docs, f, indent=2, default=str)
        except Exception as e:
            logger.error(f"Error writing to local document store {self.file_path}: {e}")

    def insert_one(self, doc: Dict[str, Any]):
        doc_copy = dict(doc)
        if "_id" not in doc_copy:
            import uuid
            doc_copy["_id"] = str(uuid.uuid4())
        docs = self._read()
        docs.append(doc_copy)
        self._write(docs)
        
        class InsertResult:
            inserted_id = doc_copy["_id"]
        return InsertResult()

    def insert_many(self, documents: List[Dict[str, Any]]):
        import uuid
        docs = self._read()
        ids = []
        for d in documents:
            c = dict(d)
            if "_id" not in c:
                c["_id"] = str(uuid.uuid4())
            ids.append(c["_id"])
            docs.append(c)
        self._write(docs)
        
        class InsertManyResult:
            inserted_ids = ids
        return InsertManyResult()

    def find(self, filter: Optional[Dict[str, Any]] = None, sort: Optional[List[tuple]] = None, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        docs = self._read()
        # Basic filtering if provided
        filtered = docs
        if filter:
            for k, v in filter.items():
                filtered = [d for d in filtered if d.get(k) == v]
        
        # Sorting
        if sort:
            for field, order in reversed(sort):
                reverse = (order == pymongo.DESCENDING or order == -1)
                filtered = sorted(filtered, key=lambda x: x.get(field) or 0, reverse=reverse)

        if limit is not None and limit > 0:
            filtered = filtered[:limit]

        return filtered

    def find_one(self, filter: Optional[Dict[str, Any]] = None, sort: Optional[List[tuple]] = None) -> Optional[Dict[str, Any]]:
        results = self.find(filter=filter, sort=sort, limit=1)
        return results[0] if results else None

    def count_documents(self, filter: Optional[Dict[str, Any]] = None) -> int:
        return len(self.find(filter=filter))

    def delete_many(self, filter: Optional[Dict[str, Any]] = None):
        if not filter:
            self._write([])
        else:
            docs = self._read()
            for k, v in filter.items():
                docs = [d for d in docs if d.get(k) != v]
            self._write(docs)


class DualModeDatabase:
    """Wraps PyMongo Database or falls back to PersistentFileCollection."""
    def __init__(self, raw_db: Optional[Database]):
        self.raw_db = raw_db

    def get_collection(self, name: str):
        if self.raw_db is not None:
            return self.raw_db[name]
        return PersistentFileCollection(LOCAL_STORE_PATH)

    def __getitem__(self, name: str):
        return self.get_collection(name)


def get_db() -> DualModeDatabase:
    """
    Returns the MongoDB database instance.
    Attempts live PyMongo connection, seamlessly falling back to file persistence if MongoDB is offline.
    """
    try:
        client = pymongo.MongoClient(MONGO_URI, serverSelectionTimeoutMS=1500)
        # Probe connection
        client.admin.command("ping")
        logger.info(f"Connected to live MongoDB at {MONGO_URI}")
        return DualModeDatabase(client[DB_NAME])
    except Exception as e:
        logger.info(f"Live MongoDB not reachable ({e}). Using persistent disk-backed collection at {LOCAL_STORE_PATH}")
        return DualModeDatabase(None)


def get_real_time_collection():
    """Convenience helper to retrieve the 'real_time_data' collection."""
    db = get_db()
    return db["real_time_data"]
