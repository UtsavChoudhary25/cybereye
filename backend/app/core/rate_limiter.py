import time
from typing import Dict, Tuple
from collections import defaultdict
from app.core.config import settings

class LoginRateLimiter:
    """In-memory sliding-window rate limiter for brute-force defense on authentication endpoints."""
    def __init__(self):
        # Key: (ip, email) -> list of timestamp floats
        self._attempts: Dict[Tuple[str, str], list] = defaultdict(list)
        # Key: ip -> list of timestamp floats (to block distributed spraying from one IP)
        self._ip_attempts: Dict[str, list] = defaultdict(list)

    def is_rate_limited(self, ip: str, email: str) -> Tuple[bool, int]:
        """
        Check if the target IP or (IP, email) pair has exceeded maximum failed attempts.
        Returns (is_limited, retry_after_seconds).
        """
        now = time.time()
        window = settings.AUTH_RATE_LIMIT_WINDOW_SECONDS
        max_attempts = settings.AUTH_RATE_LIMIT_MAX_ATTEMPTS

        # Clean old attempts
        key = (ip, email.lower().strip())
        self._attempts[key] = [t for t in self._attempts[key] if now - t < window]
        self._ip_attempts[ip] = [t for t in self._ip_attempts[ip] if now - t < window]

        # Check (ip, email) threshold
        if len(self._attempts[key]) >= max_attempts:
            oldest = self._attempts[key][0]
            retry_after = int(window - (now - oldest))
            return True, max(1, retry_after)

        # Check raw IP brute-force threshold (15 attempts across any emails)
        if len(self._ip_attempts[ip]) >= max_attempts * 3:
            oldest = self._ip_attempts[ip][0]
            retry_after = int(window - (now - oldest))
            return True, max(1, retry_after)

        return False, 0

    def record_failure(self, ip: str, email: str):
        now = time.time()
        key = (ip, email.lower().strip())
        self._attempts[key].append(now)
        self._ip_attempts[ip].append(now)

    def record_success(self, ip: str, email: str):
        key = (ip, email.lower().strip())
        self._attempts.pop(key, None)

login_rate_limiter = LoginRateLimiter()
