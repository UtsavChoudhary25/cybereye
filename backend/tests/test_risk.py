import pytest
from app.intelligence.risk_engine import RiskScoringEngine

def test_risk_scoring_engine_calculation():
    sample_data = {
        "dns": {
            "data": {
                "records": {
                    "A": ["198.51.100.24", "198.51.100.25"],
                    "MX": ["mail.target.com"]
                }
            }
        },
        "tech": {
            "data": {
                "server": "nginx/1.24.0",
                "missing_security_headers": ["strict_transport_security", "content_security_policy"]
            }
        },
        "vuln": {
            "data": {
                "vulnerabilities": [
                    {"cve_id": "CVE-2024-24919", "severity": "CRITICAL", "cvss": 9.8, "title": "Critical RCE"}
                ]
            }
        },
        "reputation": {
            "data": {
                "threat_classification": "ELEVATED_ATTENTION",
                "blocklists_listed": 1
            }
        }
    }

    result = RiskScoringEngine.calculate("acme-defense.org", sample_data)
    assert result.score > 50
    assert result.level in ["HIGH", "CRITICAL"]
    assert len(result.breakdown) >= 4
    assert "heuristic assessment" in result.formula_label
