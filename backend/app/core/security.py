import secrets
import hashlib
import datetime
from typing import Optional, Dict, Any
import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError, InvalidHashError
from app.core.config import settings

# Production-grade Argon2id hasher configuration
# time_cost: iterations (3), memory_cost: kibibytes (65536 = 64MB), parallelism: threads (4)
hasher = PasswordHasher(
    time_cost=3,
    memory_cost=65536,
    parallelism=4,
    hash_len=32
)

def hash_password(password: str) -> str:
    """Hash password using Argon2id with automatic salt generation."""
    return hasher.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against Argon2id hash with constant-time resistance."""
    try:
        return hasher.verify(hashed_password, plain_password)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False
    except Exception:
        return False

def create_access_token(
    user_id: int, 
    role: str, 
    email: str, 
    session_jti: Optional[str] = None, 
    expires_delta: Optional[datetime.timedelta] = None
) -> Dict[str, Any]:
    """Create signed JWT access token with JTI for session tracking/revocation."""
    now = datetime.datetime.now(datetime.timezone.utc)
    jti = session_jti or secrets.token_hex(16)
    
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    payload = {
        "iss": "cybereye-defense-soc",
        "sub": str(user_id),
        "role": role,
        "email": email,
        "jti": jti,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp())
    }
    
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_at": expire.isoformat(),
        "jti": jti
    }

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and validate signature and expiry of access token."""
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
            issuer="cybereye-defense-soc",
            options={"require": ["exp", "iss", "sub", "jti"]}
        )
        return payload
    except jwt.PyJWTError:
        return None

def generate_reset_token() -> str:
    """Generate cryptographically secure high-entropy token for password reset."""
    return secrets.token_urlsafe(32)

def hash_token(token: str) -> str:
    """Hash sensitive token before storing in database."""
    return hashlib.sha256(token.encode('utf-8')).hexdigest()
