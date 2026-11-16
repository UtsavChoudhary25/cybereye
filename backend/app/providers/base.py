import abc
import datetime
import time
from typing import Dict, Any, List, Optional
from app.core.logging import logger

class DataProvider(abc.ABC):
    """
    Abstract base class for all external real-data providers in CyberEye.
    Ensures safe error handling, caching, schema validation, and health reporting.
    A failed provider will NEVER crash CyberEye.
    """
    def __init__(self, name: str, category: str, docs_url: Optional[str] = None, cache_ttl_seconds: int = 300):
        self.name = name
        self.category = category
        self.docs_url = docs_url
        self.cache_ttl_seconds = cache_ttl_seconds
        self.last_successful_update: Optional[datetime.datetime] = None
        self.last_error: Optional[str] = None
        self.cached_items: List[Dict[str, Any]] = []
        self._last_fetch_time: float = 0
        self.is_configured: bool = True

    @abc.abstractmethod
    async def fetch(self) -> Any:
        """Fetch raw data from external upstream API or feed."""
        pass

    @abc.abstractmethod
    def normalize(self, raw_data: Any) -> List[Dict[str, Any]]:
        """Map raw provider payload into standardized CyberEye structure."""
        pass

    def validate(self, item: Dict[str, Any]) -> bool:
        """Validate item has required fields and realistic coordinates."""
        lat = item.get("latitude")
        lon = item.get("longitude")
        if lat is None or lon is None:
            return False
        try:
            lat_f = float(lat)
            lon_f = float(lon)
            return -90.0 <= lat_f <= 90.0 and -180.0 <= lon_f <= 180.0
        except (ValueError, TypeError):
            return False

    async def get_data(self, force_refresh: bool = False) -> List[Dict[str, Any]]:
        """
        Retrieves normalized and validated data, utilizing in-memory cache when fresh.
        Catches all upstream network or parsing errors to guarantee resilience.
        """
        now = time.time()
        if not force_refresh and self.cached_items and (now - self._last_fetch_time < self.cache_ttl_seconds):
            return self.cached_items

        try:
            raw = await self.fetch()
            normalized = self.normalize(raw)
            validated = [item for item in normalized if self.validate(item)]
            if validated:
                self.cached_items = validated
                self.last_successful_update = datetime.datetime.utcnow()
                self._last_fetch_time = now
                self.last_error = None
                logger.info(f"Provider [{self.name}] successfully refreshed with {len(validated)} items.")
            elif not self.cached_items:
                logger.warning(f"Provider [{self.name}] fetched 0 valid items.")
        except Exception as e:
            self.last_error = str(e)
            logger.error(f"Provider [{self.name}] fetch error: {e}. Serving cached data ({len(self.cached_items)} items).")

        return self.cached_items

    def get_status(self) -> Dict[str, Any]:
        """Returns standard health status dictionary for monitoring."""
        if not self.is_configured:
            status = "NOT_CONFIGURED"
        elif self.last_error and not self.cached_items:
            status = "OFFLINE"
        elif self.last_error and self.cached_items:
            status = "DEGRADED"
        else:
            status = "ONLINE"

        return {
            "name": self.name,
            "category": self.category,
            "status": status,
            "is_configured": self.is_configured,
            "last_update": self.last_successful_update.isoformat() if self.last_successful_update else None,
            "items_count": len(self.cached_items),
            "message": self.last_error or "Operational",
            "docs_url": self.docs_url
        }
