import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional, Dict, Any

from app.database.session import get_db
from app.models.database import User, UserSession, AuditLog
from app.schemas.auth_schemas import UserResponse, AuditLogResponse
from app.api.deps import require_admin
from app.services.audit_service import audit_service, get_client_ip, get_user_agent_summary

router = APIRouter(prefix="/admin", tags=["Administration & Security Auditing"])

@router.get("/audit-logs", response_model=Dict[str, Any])
async def get_audit_logs(
    event_type: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    user_id: Optional[int] = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Fetch system-wide security audit trail.
    Restricted to authorized administrators.
    """
    logs = audit_service.get_audit_logs(
        db=db,
        event_type=event_type,
        user_id=user_id,
        status=status_filter,
        limit=limit,
        offset=offset
    )

    total_count = db.query(func.count(AuditLog.id)).scalar()

    # Failed login attempts summary in the last 24h
    since_24h = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=24)
    failed_logins_24h = db.query(func.count(AuditLog.id)).filter(
        AuditLog.event_type == "LOGIN_FAILURE",
        AuditLog.timestamp >= since_24h
    ).scalar() or 0

    return {
        "total": total_count,
        "failed_logins_24h": failed_logins_24h,
        "items": [AuditLogResponse.model_validate(log) for log in logs]
    }

@router.get("/users", response_model=List[UserResponse])
async def list_users(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """List all accounts for user management (Admin only)."""
    return db.query(User).order_by(User.created_at.desc()).all()

@router.put("/users/{target_user_id}/status")
async def toggle_user_status(
    target_user_id: int,
    is_active: bool,
    request: Request,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Enable or disable a user account (Admin only)."""
    if target_user_id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change active status of your own administrator account"
        )

    target_user = db.query(User).filter(User.id == target_user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    target_user.is_active = is_active
    db.commit()

    client_ip = get_client_ip(request)
    ua = get_user_agent_summary(request)
    audit_service.log_event(
        db=db,
        event_type="ADMIN_USER_STATUS_CHANGE",
        severity="WARNING",
        user_id=admin.id,
        user_email=admin.email,
        ip_address=client_ip,
        user_agent=ua,
        status="SUCCESS",
        details={
            "target_user_id": target_user.id,
            "target_email": target_user.email,
            "new_status": is_active
        }
    )

    return {"message": f"User {target_user.email} status updated to is_active={is_active}"}

@router.delete("/users/{target_user_id}/sessions")
async def revoke_user_sessions_admin(
    target_user_id: int,
    request: Request,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Force revocation of all active sessions for a target user (Admin only)."""
    target_user = db.query(User).filter(User.id == target_user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    now = datetime.datetime.now(datetime.timezone.utc)
    sessions = db.query(UserSession).filter(
        UserSession.user_id == target_user.id,
        UserSession.is_revoked == False
    ).all()

    for s in sessions:
        s.is_revoked = True
        s.revoked_at = now

    db.commit()

    client_ip = get_client_ip(request)
    ua = get_user_agent_summary(request)
    audit_service.log_event(
        db=db,
        event_type="ADMIN_FORCE_REVOKE_SESSIONS",
        severity="WARNING",
        user_id=admin.id,
        user_email=admin.email,
        ip_address=client_ip,
        user_agent=ua,
        status="SUCCESS",
        details={
            "target_user_id": target_user.id,
            "revoked_count": len(sessions)
        }
    )

    return {"message": f"Successfully revoked {len(sessions)} active sessions for user {target_user.email}"}
