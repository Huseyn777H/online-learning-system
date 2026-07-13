import hashlib
import json
from typing import Any, Callable, Optional

from app.redis_client import safe_get, safe_scan_delete, safe_set

COURSE_LIST_TTL = 60
COURSE_SEARCH_TTL = 60
ADMIN_STATS_TTL = 30


def _hash_query(params: dict[str, Any]) -> str:
    normalized = json.dumps(params, sort_keys=True, default=str)
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()[:16]


def course_list_key(params: dict[str, Any]) -> str:
    return f"courses:list:{_hash_query(params)}"


def course_search_key(params: dict[str, Any]) -> str:
    return f"courses:search:{_hash_query(params)}"


def admin_stats_key() -> str:
    return "admin:stats"


def get_cached_json(key: str) -> Optional[Any]:
    raw = safe_get(key)
    if raw is None:
        return None
    try:
        return json.loads(raw)
    except (TypeError, ValueError):
        return None


def set_cached_json(key: str, value: Any, ttl_seconds: int) -> None:
    safe_set(key, json.dumps(value, default=str), ttl_seconds=ttl_seconds)


def cached_or_compute(key: str, ttl_seconds: int, compute: Callable[[], Any]) -> Any:
    """Return cached JSON-able value at `key`, else compute, cache, and return it."""
    cached = get_cached_json(key)
    if cached is not None:
        return cached
    value = compute()
    set_cached_json(key, value, ttl_seconds)
    return value


def invalidate_courses_cache() -> None:
    """Invalidate all course list/search cache entries. Call on course create/update/delete/enroll."""
    safe_scan_delete("courses:*")


def invalidate_admin_stats_cache() -> None:
    """Invalidate the admin stats cache. Call on user/course/enrollment/submission changes."""
    safe_scan_delete("admin:stats")
