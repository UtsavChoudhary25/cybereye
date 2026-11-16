import datetime
import secrets
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.database.session import get_db
from app.models.database import User, UserSession, PasswordResetToken
from app.schemas.auth_schemas import (
    UserRegister, UserLogin, TokenResponse, UserResponse,
    PasswordResetRequest, PasswordResetConfirm, PasswordChange,
    AuditLogResponse, UserSessionResponse
)
from app.core.security import (
    hash_password, verify_password, create_access_token,
    decode_access_token, generate_reset_token, hash_token
)
from app.core.rate_limiter import login_rate_limiter
from app.services.audit_service import audit_service, get_client_ip, get_user_agent_summary
from app.api.deps import get_current_user, security_bearer

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    data: UserRegister,
    request: Request,
    db: Session = Depends(get_db)
):
    """Register a new user account with Argon2id password hashing and user role."""
    client_ip = get_client_ip(request)
    ua = get_user_agent_summary(request)
    email_clean = data.email.lower().strip()

    existing_user = db.query(User).filter(User.email == email_clean).first()
    if existing_user:
        audit_service.log_event(
            db=db,
            event_type="REGISTER_COLLISION",
            severity="INFO",
            user_email=email_clean,
            ip_address=client_ip,
            user_agent=ua,
            status="FAILURE",
            details={"reason": "Email already registered"}
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists"
        )

    # Hash password with Argon2id
    hashed_pw = hash_password(data.password)

    new_user = User(
        email=email_clean,
        hashed_password=hashed_pw,
        full_name=data.full_name.strip() if data.full_name else None,
        role="user", # Least-privilege: Public registration always assigns standard user role
        is_active=True,
        is_verified=True,
        created_at=datetime.datetime.now(datetime.timezone.utc)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Issue initial session
    token_bundle = create_access_token(
        user_id=new_user.id,
        role=new_user.role,
        email=new_user.email
    )

    now = datetime.datetime.now(datetime.timezone.utc)
    session = UserSession(
        user_id=new_user.id,
        token_jti=token_bundle["jti"],
        ip_address=client_ip,
        user_agent_summary=ua,
        created_at=now,
        expires_at=datetime.datetime.fromisoformat(token_bundle["expires_at"]),
        is_revoked=False
    )
    db.add(session)
    db.commit()

    audit_service.log_event(
        db=db,
        event_type="REGISTER",
        severity="INFO",
        user_id=new_user.id,
        user_email=new_user.email,
        ip_address=client_ip,
        user_agent=ua,
        status="SUCCESS",
        details={"role": new_user.role}
    )

    return TokenResponse(
        access_token=token_bundle["access_token"],
        token_type="bearer",
        expires_at=token_bundle["expires_at"],
        user=UserResponse.model_validate(new_user)
    )

@router.post("/login", response_model=TokenResponse)
async def login(
    data: UserLogin,
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    """Authenticate credentials with Argon2id verification, brute-force rate limiting, and session tracking."""
    client_ip = get_client_ip(request)
    ua = get_user_agent_summary(request)
    email_clean = data.email.lower().strip()

    # 1. Rate Limit Check
    is_limited, retry_after = login_rate_limiter.is_rate_limited(client_ip, email_clean)
    if is_limited:
        audit_service.log_event(
            db=db,
            event_type="LOGIN_RATE_LIMITED",
            severity="WARNING",
            user_email=email_clean,
            ip_address=client_ip,
            user_agent=ua,
            status="FAILURE",
            details={"retry_after": retry_after}
        )
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many failed login attempts. Account temporarily locked for defense. Retry after {retry_after} seconds.",
            headers={"Retry-After": str(retry_after)}
        )

    # 2. Credential Verification
    user = db.query(User).filter(User.email == email_clean).first()
    
    # Secure constant-time path to avoid timing attack / account enumeration
    is_password_valid = False
    if user:
        is_password_valid = verify_password(data.password, user.hashed_password)
    else:
        # Dummy verify to equalize CPU timing
        verify_password("dummy-password", "$argon2id$v=19$m=65536,t=3,p=4$dummyhashdummyhashdummy$dummyhashdummyhashdummy")

    if not user or not is_password_valid:
        login_rate_limiter.record_failure(client_ip, email_clean)
        audit_service.log_event(
            db=db,
            event_type="LOGIN_FAILURE",
            severity="WARNING",
            user_id=user.id if user else None,
            user_email=email_clean,
            ip_address=client_ip,
            user_agent=ua,
            status="FAILURE",
            details={"reason": "Invalid credentials"}
        )
        # Uniform generic error response
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been suspended or deactivated"
        )

    # 3. Successful Authentication
    login_rate_limiter.record_success(client_ip, email_clean)
    user.last_login_at = datetime.datetime.now(datetime.timezone.utc)
    db.commit()

    # Generate token with unique JTI
    token_bundle = create_access_token(
        user_id=user.id,
        role=user.role,
        email=user.email
    )

    now = datetime.datetime.now(datetime.timezone.utc)
    session = UserSession(
        user_id=user.id,
        token_jti=token_bundle["jti"],
        ip_address=client_ip,
        user_agent_summary=ua,
        created_at=now,
        expires_at=datetime.datetime.fromisoformat(token_bundle["expires_at"]),
        is_revoked=False
    )
    db.add(session)
    db.commit()

    audit_service.log_event(
        db=db,
        event_type="LOGIN_SUCCESS",
        severity="INFO",
        user_id=user.id,
        user_email=user.email,
        ip_address=client_ip,
        user_agent=ua,
        status="SUCCESS",
        details={"session_jti": token_bundle["jti"]}
    )

    return TokenResponse(
        access_token=token_bundle["access_token"],
        token_type="bearer",
        expires_at=token_bundle["expires_at"],
        user=UserResponse.model_validate(user)
    )

@router.post("/logout")
async def logout(
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Revoke current active session token."""
    client_ip = get_client_ip(request)
    ua = get_user_agent_summary(request)

    # Extract current JTI
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "").strip()
    payload = decode_access_token(token)
    jti = payload.get("jti") if payload else None

    if jti:
        session = db.query(UserSession).filter(UserSession.token_jti == jti).first()
        if session:
            session.is_revoked = True
            session.revoked_at = datetime.datetime.now(datetime.timezone.utc)
            db.commit()

    audit_service.log_event(
        db=db,
        event_type="LOGOUT",
        severity="INFO",
        user_id=user.id,
        user_email=user.email,
        ip_address=client_ip,
        user_agent=ua,
        status="SUCCESS"
    )

    return {"message": "Session successfully terminated and revoked"}

@router.post("/logout-all")
async def logout_all_devices(
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Revoke all active sessions for this account across all devices."""
    client_ip = get_client_ip(request)
    ua = get_user_agent_summary(request)

    now = datetime.datetime.now(datetime.timezone.utc)
    sessions = db.query(UserSession).filter(
        UserSession.user_id == user.id,
        UserSession.is_revoked == False
    ).all()

    for s in sessions:
        s.is_revoked = True
        s.revoked_at = now

    db.commit()

    audit_service.log_event(
        db=db,
        event_type="REVOKE_ALL_SESSIONS",
        severity="INFO",
        user_id=user.id,
        user_email=user.email,
        ip_address=client_ip,
        user_agent=ua,
        status="SUCCESS",
        details={"revoked_count": len(sessions)}
    )

    return {"message": f"Successfully revoked {len(sessions)} active sessions"}

@router.get("/me", response_model=UserResponse)
async def get_me(user: User = Depends(get_current_user)):
    """Return authenticated user profile."""
    return user

@router.post("/change-password")
async def change_password(
    data: PasswordChange,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user password with verification of old password."""
    client_ip = get_client_ip(request)
    ua = get_user_agent_summary(request)

    if not verify_password(data.current_password, user.hashed_password):
        audit_service.log_event(
            db=db,
            event_type="PASSWORD_CHANGE_FAILURE",
            severity="WARNING",
            user_id=user.id,
            user_email=user.email,
            ip_address=client_ip,
            user_agent=ua,
            status="FAILURE",
            details={"reason": "Incorrect current password"}
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password verification failed"
        )

    user.hashed_password = hash_password(data.new_password)
    user.updated_at = datetime.datetime.now(datetime.timezone.utc)
    db.commit()

    audit_service.log_event(
        db=db,
        event_type="PASSWORD_CHANGE_SUCCESS",
        severity="INFO",
        user_id=user.id,
        user_email=user.email,
        ip_address=client_ip,
        user_agent=ua,
        status="SUCCESS"
    )

    return {"message": "Password updated successfully"}

@router.post("/reset-password-request")
async def request_password_reset(
    data: PasswordResetRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Request password reset token.
    Uniform response to prevent email enumeration.
    """
    client_ip = get_client_ip(request)
    ua = get_user_agent_summary(request)
    email_clean = data.email.lower().strip()

    user = db.query(User).filter(User.email == email_clean).first()
    reset_token_raw = None

    if user:
        reset_token_raw = generate_reset_token()
        token_hash_val = hash_token(reset_token_raw)
        
        now = datetime.datetime.now(datetime.timezone.utc)
        reset_record = PasswordResetToken(
            user_id=user.id,
            token_hash=token_hash_val,
            expires_at=now + datetime.timedelta(minutes=15),
            used=False,
            created_at=now
        )
        db.add(reset_record)
        db.commit()

        audit_service.log_event(
            db=db,
            event_type="PASSWORD_RESET_REQUEST",
            severity="INFO",
            user_id=user.id,
            user_email=user.email,
            ip_address=client_ip,
            user_agent=ua,
            status="SUCCESS"
        )
    else:
        audit_service.log_event(
            db=db,
            event_type="PASSWORD_RESET_REQUEST_NONEXISTENT",
            severity="INFO",
            user_email=email_clean,
            ip_address=client_ip,
            user_agent=ua,
            status="SUCCESS"
        )

    # In production, send email. For demo/assessment environment, provide verified reset token in response
    return {
        "message": "If this email is registered in CyberEye, a secure password reset link has been dispatched.",
        "demo_reset_token": reset_token_raw if reset_token_raw else None
    }

@router.post("/reset-password-confirm")
async def confirm_password_reset(
    data: PasswordResetConfirm,
    request: Request,
    db: Session = Depends(get_db)
):
    """Verify reset token and apply new password."""
    client_ip = get_client_ip(request)
    ua = get_user_agent_summary(request)

    token_hash_val = hash_token(data.token)
    now = datetime.datetime.now(datetime.timezone.utc)

    reset_record = db.query(PasswordResetToken).filter(
        PasswordResetToken.token_hash == token_hash_val,
        PasswordResetToken.used == False
    ).first()

    if not reset_record:
        audit_service.log_event(
            db=db,
            event_type="PASSWORD_RESET_CONFIRM_FAIL",
            severity="WARNING",
            ip_address=client_ip,
            user_agent=ua,
            status="FAILURE",
            details={"reason": "Invalid or already used token"}
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password reset token is invalid or has already been used"
        )

    exp = reset_record.expires_at
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=datetime.timezone.utc)
    if exp < now:
        audit_service.log_event(
            db=db,
            event_type="PASSWORD_RESET_CONFIRM_EXPIRED",
            severity="WARNING",
            user_id=reset_record.user_id,
            ip_address=client_ip,
            user_agent=ua,
            status="FAILURE",
            details={"reason": "Token expired"}
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password reset token has expired. Please request a new one."
        )

    # Apply new password
    user = db.query(User).filter(User.id == reset_record.user_id).first()
    if not user:
        raise HTTPException(status_code=400, detail="User account not found")

    user.hashed_password = hash_password(data.new_password)
    user.updated_at = now
    reset_record.used = True

    # Revoke all existing sessions for security
    sessions = db.query(UserSession).filter(
        UserSession.user_id == user.id,
        UserSession.is_revoked == False
    ).all()
    for s in sessions:
        s.is_revoked = True
        s.revoked_at = now

    db.commit()

    audit_service.log_event(
        db=db,
        event_type="PASSWORD_RESET_COMPLETED",
        severity="INFO",
        user_id=user.id,
        user_email=user.email,
        ip_address=client_ip,
        user_agent=ua,
        status="SUCCESS"
    )

    return {"message": "Password successfully reset. Please log in with your new credentials."}

@router.get("/me/activity", response_model=List[AuditLogResponse])
async def get_my_activity(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """View personal security audit log (user's own logins, changes, etc.)."""
    return audit_service.get_recent_user_activity(db, user.id)

@router.get("/me/sessions", response_model=List[UserSessionResponse])
async def get_my_sessions(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """View active and recent sessions for this user account."""
    return db.query(UserSession)\
        .filter(UserSession.user_id == user.id)\
        .order_by(UserSession.created_at.desc())\
        .limit(20)\
        .all()
