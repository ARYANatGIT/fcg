"""
ForecastGuard AI — Database Client & Connection Manager
Supports any MongoDB deployment (local, Docker, or MongoDB Atlas cloud URI)
via PyMongo with automatic fallback to persistent disk-backed JSON collections.
"""

import os
import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional
import pymongo
from pymongo.collection import Collection
from pymongo.database import Database

from dotenv import load_dotenv
load_dotenv()

logger = logging.getLogger("forecastguard.db")

# Read MongoDB URI from environment.
# Accepts cloud Atlas ('mongodb+srv://...'), local ('mongodb://localhost:27017'), or Docker.
DEFAULT_MONGO_URI = "mongodb://localhost:27017/forecastguard"
MONGO_URI = os.getenv("MONGO_URI", DEFAULT_MONGO_URI)
DB_NAME = os.getenv("MONGO_DB_NAME", "forecastguard")
DATA_DIR = Path(os.getenv("DATA_STORE_DIR", "data/real_time"))
DATA_DIR.mkdir(parents=True, exist_ok=True)


class PersistentFileCollection:
    """
    Drop-in implementation of the PyMongo Collection interface.
    Persists documents to disk as JSON for cross-process communication
    when a live MongoDB instance is not connected.
    """

    def __init__(self, collection_name: str, base_dir: Path = DATA_DIR):
        self.collection_name = collection_name
        self.file_path = base_dir / f"{collection_name}.json"
        self.file_path.parent.mkdir(parents=True, exist_ok=True)
        self._cache = None
        self._last_mtime = 0
        if not self.file_path.exists():
            self._write([])

    def _read(self) -> List[Dict[str, Any]]:
        try:
            if not self.file_path.exists():
                return []
            mtime = self.file_path.stat().st_mtime
            if self._cache is not None and mtime == self._last_mtime:
                return self._cache
            with open(self.file_path, "r", encoding="utf-8") as f:
                self._cache = json.load(f)
                self._last_mtime = mtime
                return self._cache
        except Exception as e:
            logger.error(f"Error reading JSON store for collection '{self.collection_name}': {e}")
            return []

    def _write(self, docs: List[Dict[str, Any]]) -> None:
        try:
            with open(self.file_path, "w", encoding="utf-8") as f:
                json.dump(docs, f, indent=2, default=str)
            self._cache = docs
            if self.file_path.exists():
                self._last_mtime = self.file_path.stat().st_mtime
        except Exception as e:
            logger.error(f"Error writing to JSON store for collection '{self.collection_name}': {e}")

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

    def find(
        self,
        filter: Optional[Dict[str, Any]] = None,
        sort: Optional[List[tuple]] = None,
        limit: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        docs = self._read()
        filtered = docs
        if filter:
            for k, v in filter.items():
                filtered = [d for d in filtered if d.get(k) == v]

        if sort:
            for field, order in reversed(sort):
                reverse = order in (pymongo.DESCENDING, -1)
                filtered = sorted(
                    filtered,
                    key=lambda x: (x.get(field) is not None, x.get(field) or 0),
                    reverse=reverse,
                )

        if limit is not None and limit > 0:
            filtered = filtered[:limit]

        return filtered

    def find_one(
        self,
        filter: Optional[Dict[str, Any]] = None,
        sort: Optional[List[tuple]] = None,
    ) -> Optional[Dict[str, Any]]:
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
        return PersistentFileCollection(name)

    def __getitem__(self, name: str):
        return self.get_collection(name)


_client_instance = None
_db_instance = None


def reset_db_connection():
    """Resets the cached database connection."""
    global _client_instance, _db_instance
    if _client_instance is not None:
        try:
            _client_instance.close()
        except Exception:
            pass
    _client_instance = None
    _db_instance = None


def get_db() -> DualModeDatabase:
    """
    Returns the MongoDB database instance.
    Uses MONGO_URI environment variable (e.g. mongodb://localhost:27017 or Atlas cloud URI).
    If connection cannot be established, transparently falls back to persistent JSON storage.
    """
    global _client_instance, _db_instance
    if _db_instance is not None and _db_instance.raw_db is not None:
        return _db_instance

    try:
        client = pymongo.MongoClient(
            MONGO_URI,
            serverSelectionTimeoutMS=10000,
            connectTimeoutMS=30000,
            socketTimeoutMS=120000,
        )
        client.admin.command("ping")
        logger.info(f"Connected to live MongoDB at {MONGO_URI}")
        try:
            database = client.get_default_database()
            if database is None:
                database = client[DB_NAME]
        except Exception:
            database = client[DB_NAME]
        _client_instance = client
        _db_instance = DualModeDatabase(database)
        return _db_instance
    except Exception as e:
        logger.info(f"Live MongoDB not reachable on {MONGO_URI} ({e}). Using persistent disk-backed collection in {DATA_DIR}")
        _db_instance = DualModeDatabase(None)
        return _db_instance


def get_real_time_collection():
    """Convenience helper for 'real_time_data' collection."""
    return get_db()["real_time_data"]


def get_air_quality_collection():
    """Convenience helper for 'air_quality_data' collection."""
    return get_db()["air_quality_data"]


def get_ensemble_collection():
    """Convenience helper for 'ensemble_data' collection."""
    return get_db()["ensemble_data"]


def get_marine_flood_collection():
    """Convenience helper for 'marine_flood_data' collection."""
    return get_db()["marine_flood_data"]


def get_evaluations_collection():
    """Convenience helper for 'model_evaluations' collection."""
    return get_db()["model_evaluations"]


def get_chat_sessions_collection():
    """Convenience helper for temporary 'chat_sessions' collection."""
    col = get_db()["chat_sessions"]
    try:
        # Create TTL index on created_at (expire after 2 hours = 7200s) if using live MongoDB
        if hasattr(col, "create_index"):
            col.create_index("created_at", expireAfterSeconds=7200)
    except Exception:
        pass
    return col


def get_disruptions_collection():
    """Convenience helper for 'disruptions_news' collection."""
    return get_db()["disruptions_news"]


def get_synoptic_regimes_collection():
    """Convenience helper for 'synoptic_regimes' collection."""
    return get_db()["synoptic_regimes"]


def get_historical_busts_collection():
    """Convenience helper for 'historical_busts' collection."""
    return get_db()["historical_busts"]


def get_whatif_scenarios_collection():
    """Convenience helper for 'whatif_scenarios' collection."""
    return get_db()["whatif_scenarios"]

