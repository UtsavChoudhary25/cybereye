import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.web_scanner_service import WebScannerService

def test_get_scan_presets():
    """Verify that preset targets are returned for instant UI testing."""
    with TestClient(app) as client:
        res = client.get("/api/scanner/presets")
        assert res.status_code == 200
        data = res.json()
        assert len(data) >= 3
        assert any("example.com" in p["url"] for p in data)

def test_remediation_library_integrity():
    """Verify that every vulnerability rule has comprehensive multi-framework code patches."""
    lib = WebScannerService.get_remediation_library()
    assert "missing_csp" in lib
    assert "missing_hsts" in lib
    assert "missing_x_frame_options" in lib
    assert "missing_x_content_type_options" in lib
    assert "server_information_leak" in lib
    assert "sensitive_file_exposed" in lib
    assert "missing_spf_dmarc" in lib

    for rule_key, rule in lib.items():
        assert "impact" in rule
        assert "summary" in rule
        assert "patches" in rule
        patches = rule["patches"]
        assert "nginx" in patches
        assert "apache" in patches
        assert "express" in patches
        assert "nextjs" in patches
        assert "django" in patches

        # Verify patch details
        for framework, snippet in patches.items():
            assert snippet.code is not None and len(snippet.code) > 0
            assert snippet.filename is not None and len(snippet.filename) > 0
            assert snippet.instructions is not None and len(snippet.instructions) > 0

def test_scan_service_direct_execution():
    """Directly test WebScannerService with target normalization and scoring."""
    import asyncio
    result = asyncio.run(WebScannerService.scan_target("https://example.com"))
    assert result.scan_id.startswith("scan_")
    assert result.normalized_domain == "example.com"
    assert result.overall_score >= 10 and result.overall_score <= 100
    assert result.overall_grade in ("A+", "A", "B", "C", "D", "F")
    assert len(result.findings) > 0
    assert len(result.passed_checks) > 0
    
    # Check that each finding contains remediation code blocks
    for f in result.findings:
        assert f.id is not None
        assert f.severity in ("CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO")
        assert len(f.remediations) >= 3
        assert "nginx" in f.remediations

def test_scan_website_api_endpoint():
    """Verify the /api/scanner/scan POST endpoint."""
    with TestClient(app) as client:
        payload = {"url": "https://example.com", "authorized": True}
        res = client.post("/api/scanner/scan", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert "overall_score" in data
        assert "overall_grade" in data
        assert "findings" in data
        assert len(data["findings"]) > 0
        assert "findings_count" in data
