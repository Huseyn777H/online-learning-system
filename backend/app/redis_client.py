import logging
from typing import Optional

import redis

from app.config import settings

logger = logging.getLogger("app.redis")

_pool = redis.ConnectionPool.from_url(settings.REDIS_URL, decode_responses=True)
_client = redis.Redis(connection_pool=_pool)


def get_redis() -> redis.Redis:
    return _client


def safe_get(key: str) -> Optional[str]:
    """Read a key from Redis. Returns None (and logs a warning) on any failure."""
    try:
        return _client.get(key)
    except redis.RedisError as exc:
        logger.warning("Redis GET failed for key=%s: %s", key, exc)
        return None


def safe_set(key: str, value: str, ttl_seconds: Optional[int] = None) -> bool:
    """Write a key to Redis. Returns False (and logs a warning) on any failure."""
    try:
        if ttl_seconds is not None:
            _client.set(key, value, ex=ttl_seconds)
        else:
            _client.set(key, value)
        return True
    except redis.RedisError as exc:
        logger.warning("Redis SET failed for key=%s: %s", key, exc)
        return False


def safe_delete(*keys: str) -> bool:
    """Delete one or more keys from Redis. Returns False (and logs a warning) on any failure."""
    if not keys:
        return True
    try:
        _client.delete(*keys)
        return True
    except redis.RedisError as exc:
        logger.warning("Redis DELETE failed for keys=%s: %s", keys, exc)
        return False


def safe_scan_delete(pattern: str) -> bool:
    """Delete all keys matching a glob pattern (e.g. 'courses:*'). Never raises."""
    try:
        keys = list(_client.scan_iter(match=pattern))
        if keys:
            _client.delete(*keys)
        return True
    except redis.RedisError as exc:
        logger.warning("Redis SCAN/DELETE failed for pattern=%s: %s", pattern, exc)
        return False
