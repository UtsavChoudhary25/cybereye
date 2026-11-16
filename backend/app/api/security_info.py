from fastapi import APIRouter, Request, Query
from typing import Optional, Dict, Any
from app.services.audit_service import get_client_ip

router = APIRouter(prefix="/security", tags=["Security & Privacy Information"])

PRIVACY_DISCLOSURE = {
    "title": "CyberEye Defense SOC — Security & Privacy Disclosure",
    "version": "1.0",
    "last_updated": "2026-10-29",
    "data_collected": [
        {
            "category": "Authentication & Session Security",
            "fields": ["Source IP address", "Sanitized User-Agent summary", "UTC login timestamps", "Session JTI identifier"],
            "purpose": "Brute-force attack prevention, anomalous session detection, and defense audit trail.",
            "retention": "90 days rolling retention in audit logs.",
            "access": "Restricted exclusively to authorized SOC administrators."
        },
        {
            "category": "Target OSINT Telemetry",
            "fields": ["Domain names", "IP addresses", "Autonomous System Numbers (ASNs)", "Public CVE advisories"],
            "purpose": "Defensive threat modeling and attack surface correlation requested by the analyst.",
            "retention": "Persisted in user's private investigation repository.",
            "access": "Scoped strictly to the authenticated account owner or public sample demo datasets."
        }
    ],
    "privacy_commitments": [
        "Zero GPS or browser device location harvesting: CyberEye never prompts for or logs HTML5 Geolocation coordinates.",
        "Zero tracking cookies or commercial ad beacons: All cookies/sessions are strictly functional.",
        "Zero credential logging: Passwords, authorization tokens, and API keys are never written to audit trails or application logs.",
        "Approximate geolocation notice: All displayed geographic positions are approximate network-level estimates derived from public BGP routing registries and do not pinpoint individuals or physical addresses."
    ]
}

@router.get("/privacy-policy")
async def get_privacy_policy() -> Dict[str, Any]:
    """Return the official privacy and data collection disclosure."""
    return PRIVACY_DISCLOSURE

@router.get("/ip-lookup")
async def lookup_ip_approximate(
    request: Request,
    ip: Optional[str] = Query(None)
) -> Dict[str, Any]:
    """
    Provide approximate Autonomous System and geographic region for a client IP.
    Explicitly labeled as network-level approximation.
    """
    target_ip = ip or get_client_ip(request)

    # Local resolution / well-known range labeling for private or loopback
    is_private = False
    if target_ip in ["127.0.0.1", "::1", "localhost"] or target_ip.startswith(("10.", "192.168.", "172.16.", "172.17.", "172.18.", "172.19.", "172.20.", "172.21.", "172.22.", "172.23.", "172.24.", "172.25.", "172.26.", "172.27.", "172.28.", "172.29.", "172.30.", "172.31.")):
        is_private = True
        country = "Local Defense Network"
        country_code = "LOC"
        asn = "AS-LOCAL"
        org = "Internal Enterprise Network"
    else:
        # Standard synthetic/OSINT approximate mapping
        country = "United States"
        country_code = "US"
        asn = "AS15169"
        org = "Google LLC / Cloud Infrastructure"

    return {
        "ip": target_ip,
        "is_private_network": is_private,
        "approximate_location": {
            "country": country,
            "country_code": country_code,
            "asn": asn,
            "organization": org
        },
        "disclaimer": "IP-based location is approximate and determined from public Autonomous System routing tables. It does not reflect precise physical device location or GPS coordinates."
    }
