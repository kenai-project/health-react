"""CacheManager - In-memory LRU cache for analysis results."""

import os
import time
import hashlib
import logging
from typing import Optional, Any
from collections import OrderedDict

logger = logging.getLogger(__name__)

# Configuration
CACHE_TTL = int(os.environ.get("ANALYSIS_CACHE_TTL", 86400))  # 24 hours
MAX_CACHE_SIZE = int(os.environ.get("ANALYSIS_MAX_CACHE_SIZE", 1000))  # Max 1000 entries


class CacheManager:
    """In-memory LRU cache for analysis results."""

    def __init__(self, ttl: int = CACHE_TTL, max_size: int = MAX_CACHE_SIZE):
        """
        Initialize cache manager.

        Args:
            ttl: Time-to-live in seconds
            max_size: Maximum number of entries in cache
        """
        self.ttl = ttl
        self.max_size = max_size
        self.cache: OrderedDict[str, dict] = OrderedDict()

    def _generate_cache_key(
        self,
        document_id: int,
        analysis_type: str,
        prompt_hash: str,
        model_name: str,
    ) -> str:
        """
        Generate cache key.

        Args:
            document_id: Document ID
            analysis_type: Type of analysis
            prompt_hash: Hash of prompt
            model_name: LLM model name

        Returns:
            Cache key string
        """
        key = f"analysis:{document_id}:{analysis_type}:{prompt_hash}:{model_name}"
        return key

    def _hash_prompt(self, prompt: str) -> str:
        """
        Generate hash of prompt.

        Args:
            prompt: Prompt string

        Returns:
            SHA-256 hash
        """
        return hashlib.sha256(prompt.encode()).hexdigest()

    def get(
        self,
        document_id: int,
        analysis_type: str,
        prompt_hash: str,
        model_name: str,
    ) -> Optional[dict]:
        """
        Get cached analysis.

        Args:
            document_id: Document ID
            analysis_type: Type of analysis
            prompt_hash: Hash of prompt
            model_name: LLM model name

        Returns:
            Cached analysis dict or None if not found/expired
        """
        key = self._generate_cache_key(document_id, analysis_type, prompt_hash, model_name)

        if key not in self.cache:
            return None

        entry = self.cache[key]

        # Check if expired
        if time.time() - entry["timestamp"] > self.ttl:
            logger.debug(f"Cache entry expired: {key}")
            del self.cache[key]
            return None

        # Move to end (LRU)
        self.cache.move_to_end(key)

        logger.debug(f"Cache hit: {key}")
        entry["hit_count"] = entry.get("hit_count", 0) + 1
        return entry["data"]

    def set(
        self,
        document_id: int,
        analysis_type: str,
        prompt_hash: str,
        model_name: str,
        data: dict,
    ) -> None:
        """
        Set cache entry.

        Args:
            document_id: Document ID
            analysis_type: Type of analysis
            prompt_hash: Hash of prompt
            model_name: LLM model name
            data: Analysis data to cache
        """
        key = self._generate_cache_key(document_id, analysis_type, prompt_hash, model_name)

        # Evict oldest entries if cache is full
        if len(self.cache) >= self.max_size:
            logger.debug(f"Cache full, evicting oldest entry")
            self.cache.popitem(last=False)

        self.cache[key] = {
            "data": data,
            "timestamp": time.time(),
            "hit_count": 0,
        }

        logger.debug(f"Cache set: {key}")

    def invalidate_document(self, document_id: int) -> int:
        """
        Invalidate all cache entries for a document.

        Args:
            document_id: Document ID

        Returns:
            Number of entries invalidated
        """
        prefix = f"analysis:{document_id}:"
        keys_to_delete = [key for key in self.cache.keys() if key.startswith(prefix)]

        for key in keys_to_delete:
            del self.cache[key]

        logger.info(f"Invalidated {len(keys_to_delete)} cache entries for document {document_id}")
        return len(keys_to_delete)

    def clear(self) -> None:
        """Clear all cache entries."""
        self.cache.clear()
        logger.info("Cache cleared")

    def get_stats(self) -> dict:
        """
        Get cache statistics.

        Returns:
            Dict with cache stats
        """
        total_entries = len(self.cache)
        total_hits = sum(entry.get("hit_count", 0) for entry in self.cache.values())

        return {
            "total_entries": total_entries,
            "max_size": self.max_size,
            "ttl": self.ttl,
            "total_hits": total_hits,
            "hit_rate": total_hits / total_entries if total_entries > 0 else 0,
        }

    def get_keys(self, pattern: str) -> list[str]:
        """
        Get all keys matching pattern.

        Args:
            pattern: Pattern to match (supports prefix matching)

        Returns:
            List of matching keys
        """
        # Simple prefix matching
        if pattern.endswith("*"):
            prefix = pattern[:-1]
            return [key for key in self.cache.keys() if key.startswith(prefix)]
        else:
            return [key for key in self.cache.keys() if key == pattern]


# Global instance
cache_manager = CacheManager()