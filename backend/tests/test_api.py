import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.session import Base, engine, SessionLocal
from app.core.seed_data import seed_database

@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_database(db)
    db.close()
    yield

def test_api_health():
    with TestClient(app) as client:
        res = client.get("/api/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "ONLINE"
        assert data["service"] == "CyberEye"

def test_get_events():
    with TestClient(app) as client:
        res = client.get("/api/events")
        assert res.status_code == 200
        events = res.json()
        assert len(events) > 0
        assert "latitude" in events[0]
        assert "longitude" in events[0]

def test_create_investigation():
    with TestClient(app) as client:
        payload = {
            "target": "acme-defense.org",
            "target_type": "domain",
            "authorized_for_active_checks": True
        }
        res = client.post("/api/investigations", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert "investigation_id" in data
        assert "risk_assessment" in data
        assert "threat_graph" in data
        assert len(data["threat_graph"]["nodes"]) > 0

def test_get_datasources():
    with TestClient(app) as client:
        res = client.get("/api/datasources")
        assert res.status_code == 200
        sources = res.json()
        assert len(sources) > 0

def test_webcams_endpoint_removed():
    """Verify that the webcam / public-vision endpoint is completely removed (404)."""
    with TestClient(app) as client:
        res = client.get("/api/webcams")
        assert res.status_code == 404
        res_sync = client.post("/api/webcams/sync")
        assert res_sync.status_code == 404

def test_generate_report():
    """Verify that defensive report generation works without any webcam dependencies."""
    with TestClient(app) as client:
        # Create an investigation first
        inv_res = client.post("/api/investigations", json={
            "target": "defense-shield.io",
            "target_type": "domain",
            "authorized_for_active_checks": True
        })
        assert inv_res.status_code == 200
        inv_id = inv_res.json()["investigation_id"]

        # Generate dossier
        rep_res = client.post("/api/reports", json={
            "investigation_id": inv_id,
            "title": "Defense Shield Security Dossier"
        })
        assert rep_res.status_code == 200
        rep_data = rep_res.json()
        assert rep_data["target"] == "defense-shield.io"
        assert "content_json" in rep_data
        assert "webcams" not in rep_data["content_json"].get("collected_data", {})
