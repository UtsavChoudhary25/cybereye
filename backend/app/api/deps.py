import datetime
from typing import Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.security import decode_access_token
from app.models.database import User, UserSession
from app.services.audit_service import audit_service, get_client_ip, get_user_agent_summary

security_bearer = HTTPBearer(auto_error=False)

async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    db: Session = Depends(get_db)
) -> User:
    """Validate bearer token, verify active session revocation, return current user."""
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id_str = payload.get("sub")
    jti = payload.get("jti")
    if not user_id_str or not jti:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token claims",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_id = int(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user identifier",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Validate against persistent session state (revocation check)
    session = db.query(UserSession).filter(
        UserSession.token_jti == jti,
        UserSession.user_id == user_id
    ).first()

    now = datetime.datetime.now(datetime.timezone.utc)
    if not session or session.is_revoked:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has been revoked or expired",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check expiration (accounting for timezone-aware comparison)
    sess_exp = session.expires_at
    if sess_exp.tzinfo is None:
        sess_exp = sess_exp.replace(tzinfo=datetime.timezone.utc)
    if sess_exp < now:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account no longer exists",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive or disabled",
        )

    return user

async def get_current_user_optional(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Return user if authenticated, or None for guest/demo operations."""
    if not credentials or not credentials.credentials:
        return None
    try:
        return await get_current_user(request, credentials, db)
    except HTTPException:
        return None

async def require_admin(
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> User:
    """Enforce administrator role. Records access denied audit log if unauthorized."""
    if user.role != "admin":
        client_ip = get_client_ip(request)
        ua = get_user_agent_summary(request)
        audit_service.log_event(
            db=db,
            event_type="ACCESS_DENIED",
            severity="WARNING",
            user_id=user.id,
            user_email=user.email,
            ip_address=client_ip,
            user_agent=ua,
            status="FAILURE",
            details={"attempted_path": request.url.path, "role": user.role}
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Administrator privileges required"
        )
    return user
