import pytest
import time
from fastapi.testclient import TestClient
from app.main import app
from app.database.session import SessionLocal, engine, Base
from app.models.database import User, UserSession, AuditLog, Investigation, Report
from app.core.security import verify_password, hash_password
from app.core.rate_limiter import login_rate_limiter

client = TestClient(app)

@pytest.fixture(autouse=True)
def clean_test_auth():
    # Setup / Teardown test accounts
    db = SessionLocal()
    try:
        # Clear rate limiter state
        login_rate_limiter._attempts.clear()
        login_rate_limiter._ip_attempts.clear()

        # Delete any test users created during test runs
        test_emails = ["analyst@defense.org", "admin@defense.org", "attacker@evil.org", "victim@target.org"]
        test_users = db.query(User).filter(User.email.in_(test_emails)).all()
        for u in test_users:
            db.delete(u)
        db.commit()
    finally:
        db.close()
    yield

def test_user_registration_argon2():
    """Verify user registration hashes passwords with Argon2id and sets standard user role."""
    payload = {
        "email": "analyst@defense.org",
        "password": "CorrectHorseBatteryStaple!99",
        "full_name": "Tier 1 SOC Analyst"
    }
    res = client.post("/api/auth/register", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "analyst@defense.org"
    assert data["user"]["role"] == "user"

    # Verify directly in database that password is an Argon2id hash, not plaintext
    db = SessionLocal()
    user = db.query(User).filter(User.email == "analyst@defense.org").first()
    assert user is not None
    assert user.hashed_password.startswith("$argon2id$")
    assert verify_password("CorrectHorseBatteryStaple!99", user.hashed_password) is True
    assert verify_password("WrongPassword123", user.hashed_password) is False
    db.close()

def test_login_success_and_session_tracking():
    """Verify login generates signed token and persists active session."""
    # Register first
    client.post("/api/auth/register", json={
        "email": "analyst@defense.org",
        "password": "SecurePassword123!",
        "full_name": "Test Analyst"
    })

    # Login
    login_res = client.post("/api/auth/login", json={
        "email": "analyst@defense.org",
        "password": "SecurePassword123!"
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    assert token is not None

    # Test authenticated endpoint /me
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "analyst@defense.org"

def test_login_generic_error_anti_enumeration():
    """Verify generic error is returned whether email exists or not."""
    # Non-existent user
    res1 = client.post("/api/auth/login", json={
        "email": "nonexistent@cyber.org",
        "password": "SomePassword123!"
    })
    assert res1.status_code == 401
    assert res1.json()["detail"] == "Invalid email or password"

    # Existing user with wrong password
    client.post("/api/auth/register", json={
        "email": "analyst@defense.org",
        "password": "CorrectPassword123!"
    })
    res2 = client.post("/api/auth/login", json={
        "email": "analyst@defense.org",
        "password": "IncorrectPassword999!"
    })
    assert res2.status_code == 401
    assert res2.json()["detail"] == "Invalid email or password"

def test_login_rate_limiting_brute_force_protection():
    """Verify login endpoint locks out repeated failed attempts."""
    for i in range(5):
        client.post("/api/auth/login", json={
            "email": "victim@target.org",
            "password": f"BadPassword{i}!"
        })

    # 6th attempt should be blocked with 429
    blocked_res = client.post("/api/auth/login", json={
        "email": "victim@target.org",
        "password": "BadPassword6!"
    })
    assert blocked_res.status_code == 429
    assert "Retry-After" in blocked_res.headers

def test_logout_and_session_revocation():
    """Verify session is instantly revoked upon logout."""
    reg = client.post("/api/auth/register", json={
        "email": "analyst@defense.org",
        "password": "SecurePassword123!"
    })
    token = reg.json()["access_token"]

    # Valid before logout
    check_before = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert check_before.status_code == 200

    # Logout
    logout_res = client.post("/api/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert logout_res.status_code == 200

    # Token should now be rejected as revoked
    check_after = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert check_after.status_code == 401
    assert "revoked" in check_after.json()["detail"].lower()

def test_rbac_admin_vs_user_permissions():
    """Verify ordinary users cannot access administrator audit-log dashboard."""
    # Register normal user
    reg = client.post("/api/auth/register", json={
        "email": "analyst@defense.org",
        "password": "SecurePassword123!"
    })
    user_token = reg.json()["access_token"]

    # Attempt to access admin audit logs
    admin_access = client.get("/api/admin/audit-logs", headers={"Authorization": f"Bearer {user_token}"})
    assert admin_access.status_code == 403
    assert "Administrator privileges required" in admin_access.json()["detail"]

    # Now create an admin user directly
    db = SessionLocal()
    admin_user = User(
        email="admin@defense.org",
        hashed_password=hash_password("SuperSecretAdminPass123!"),
        full_name="SOC Administrator",
        role="admin",
        is_active=True
    )
    db.add(admin_user)
    db.commit()
    db.close()

    # Log in as admin
    admin_login = client.post("/api/auth/login", json={
        "email": "admin@defense.org",
        "password": "SuperSecretAdminPass123!"
    })
    admin_token = admin_login.json()["access_token"]

    # Admin should access successfully
    admin_res = client.get("/api/admin/audit-logs", headers={"Authorization": f"Bearer {admin_token}"})
    assert admin_res.status_code == 200
    assert "items" in admin_res.json()

def test_idor_protection_between_users():
    """Verify User B cannot access User A's private investigation records."""
    # 1. Create User A
    user_a_res = client.post("/api/auth/register", json={
        "email": "analyst@defense.org",
        "password": "UserAPassword123!"
    })
    token_a = user_a_res.json()["access_token"]

    # 2. User A creates private investigation
    inv_res = client.post(
        "/api/investigations",
        json={"target": "classified-target.mil", "target_type": "domain", "authorized_for_active_checks": True},
        headers={"Authorization": f"Bearer {token_a}"}
    )
    assert inv_res.status_code == 200
    inv_id = inv_res.json()["investigation_id"]

    # 3. Create User B
    user_b_res = client.post("/api/auth/register", json={
        "email": "attacker@evil.org",
        "password": "UserBPassword123!"
    })
    token_b = user_b_res.json()["access_token"]

    # 4. User B attempts to access User A's investigation by ID (IDOR Attack)
    unauthorized_get = client.get(
        f"/api/investigations/{inv_id}",
        headers={"Authorization": f"Bearer {token_b}"}
    )
    # Must be 404 to avoid leaking existence
    assert unauthorized_get.status_code == 404

    # 5. User A can access their own investigation
    authorized_get = client.get(
        f"/api/investigations/{inv_id}",
        headers={"Authorization": f"Bearer {token_a}"}
    )
    assert authorized_get.status_code == 200
    assert authorized_get.json()["target"] == "classified-target.mil"

def test_audit_logging_and_privacy_disclosure():
    """Verify audit events are logged and privacy disclosure is accessible."""
    # Check public privacy policy
    priv_res = client.get("/api/security/privacy-policy")
    assert priv_res.status_code == 200
    assert "Approximate geolocation notice" in str(priv_res.json())

    # Check approximate IP lookup
    ip_res = client.get("/api/security/ip-lookup?ip=8.8.8.8")
    assert ip_res.status_code == 200
    assert "disclaimer" in ip_res.json()
    assert "approximate" in ip_res.json()["disclaimer"].lower()
