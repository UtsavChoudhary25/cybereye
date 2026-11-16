import ipaddress
import datetime
from typing import Optional, Dict, Any, List
from fastapi import Request
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.logging import logger
from app.models.database import AuditLog

def get_client_ip(request: Request) -> str:
    """
    Securely extract client IP address.
    Only respects X-Forwarded-For if request comes directly from a configured trusted reverse proxy.
    Otherwise falls back to the immediate client.host to avoid header spoofing.
    """
    direct_ip = request.client.host if request.client else "127.0.0.1"

    # Check if direct connection is from a trusted proxy
    is_trusted = False
    try:
        direct_obj = ipaddress.ip_address(direct_ip)
        for proxy_net in settings.TRUSTED_PROXIES:
            try:
                if "/" in proxy_net:
                    if direct_obj in ipaddress.ip_network(proxy_net, strict=False):
                        is_trusted = True
                        break
                elif direct_obj == ipaddress.ip_address(proxy_net):
                    is_trusted = True
                    break
            except ValueError:
                continue
    except ValueError:
        is_trusted = False

    if is_trusted:
        x_forwarded_for = request.headers.get("X-Forwarded-For")
        if x_forwarded_for:
            # Client IP is the leftmost non-trusted address in the chain
            parts = [p.strip() for p in x_forwarded_for.split(",") if p.strip()]
            if parts:
                return parts[0]
        
        x_real_ip = request.headers.get("X-Real-IP")
        if x_real_ip:
            return x_real_ip.strip()

    return direct_ip

def get_user_agent_summary(request: Request) -> str:
    """Extract a sanitized, truncated user agent string (max 255 chars)."""
    ua = request.headers.get("User-Agent", "Unknown Browser/Client").strip()
    # Strip potential control characters or newlines to prevent log injection
    sanitized = "".join(ch for ch in ua if ch.isprintable())
    return sanitized[:250] if len(sanitized) > 250 else sanitized

class AuditService:
    @staticmethod
    def log_event(
        db: Session,
        event_type: str,
        severity: str = "INFO",
        user_id: Optional[int] = None,
        user_email: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        status: str = "SUCCESS",
        details: Optional[Dict[str, Any]] = None
    ) -> AuditLog:
        """
        Record a security-relevant event into persistent audit trail.
        CRITICAL: Never passes passwords, tokens, or private secrets in details.
        """
        safe_details = details or {}
        # Explicit sanitize pass: Remove any accidental secret keys
        sanitized_details = {}
        for k, v in safe_details.items():
            k_lower = k.lower()
            if any(secret_term in k_lower for secret_term in ["password", "token", "secret", "auth", "key", "cookie"]):
                sanitized_details[k] = "[REDACTED]"
            else:
                sanitized_details[k] = v

        audit_entry = AuditLog(
            timestamp=datetime.datetime.now(datetime.timezone.utc),
            event_type=event_type,
            severity=severity,
            user_id=user_id,
            user_email=user_email,
            ip_address=ip_address or "Unknown",
            user_agent_summary=user_agent or "Unknown Client",
            action_details=sanitized_details,
            status=status
        )

        try:
            db.add(audit_entry)
            db.commit()
            db.refresh(audit_entry)
        except Exception as e:
            logger.error(f"Failed to record audit log: {e}")
            db.rollback()

        return audit_entry

    @staticmethod
    def get_audit_logs(
        db: Session,
        event_type: Optional[str] = None,
        user_id: Optional[int] = None,
        status: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[AuditLog]:
        """Fetch audit logs (restricted to administrators)."""
        query = db.query(AuditLog)
        if event_type:
            query = query.filter(AuditLog.event_type == event_type)
        if user_id:
            query = query.filter(AuditLog.user_id == user_id)
        if status:
            query = query.filter(AuditLog.status == status)
        
        return query.order_by(AuditLog.timestamp.desc()).offset(offset).limit(limit).all()

    @staticmethod
    def get_recent_user_activity(
        db: Session,
        user_id: int,
        limit: int = 20
    ) -> List[AuditLog]:
        """Fetch personal security activity for the authenticated user only."""
        return db.query(AuditLog)\
            .filter(AuditLog.user_id == user_id)\
            .order_by(AuditLog.timestamp.desc())\
            .limit(limit)\
            .all()

audit_service = AuditService()
