import abc
import time
from typing import Dict, Any

class BaseCollector(abc.ABC):
    """
    Abstract base class for all CyberEye passive intelligence collectors.
    Ensures safe error handling, timeout resilience, and clear labeling of demo vs live data.
    """
    def __init__(self, name: str, category: str):
        self.name = name
        self.category = category

    @abc.abstractmethod
    async def collect(self, target: str, is_active_authorized: bool = False) -> Dict[str, Any]:
        """Collect intelligence on target safely."""
        pass

    def format_result(self, data: Any, is_demo: bool = False, source: str = None, error: str = None) -> Dict[str, Any]:
        return {
            "collector": self.name,
            "category": self.category,
            "timestamp": time.time(),
            "is_demo": is_demo,
            "source": source or self.name,
            "data": data,
            "error": error,
            "status": "error" if error else "success"
        }
