from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any

from app.schemas.schemas import WebScanRequest, WebScanResponse
from app.services.web_scanner_service import web_scanner_service

router = APIRouter(prefix="/scanner", tags=["Web Vulnerability Scanner"])

@router.post("/scan", response_model=WebScanResponse)
async def scan_website(req: WebScanRequest):
    """
    Executes a comprehensive, non-destructive web security vulnerability assessment
    and generates actionable remediation code patches across Nginx, Apache, Express, Next.js, and Django.
    """
    url = req.url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="Target URL cannot be empty.")

    try:
        scan_result = await web_scanner_service.scan_target(url)
        return scan_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Web security scan failed: {str(e)}")

@router.get("/presets", response_model=List[Dict[str, Any]])
async def get_scan_presets():
    """Provides curated target examples for instant demonstration and verification."""
    return [
        {
            "title": "Defense Sector Portal (High Exposure)",
            "url": "https://acme-defense.org",
            "category": "Enterprise Perimeter",
            "description": "Legacy gateway with missing CSP, unhardened cookies, and server banner leakage."
        },
        {
            "title": "Fintech Core Gateway",
            "url": "https://fintech-vault.internal",
            "category": "Financial Services",
            "description": "API microservice perimeter testing for Clickjacking, HSTS, and DMARC enforcement."
        },
        {
            "title": "Standard Reference Target",
            "url": "https://example.com",
            "category": "Public Web",
            "description": "IANA global reference domain for standard baseline audit."
        },
        {
            "title": "Local CyberEye SOC Instance",
            "url": "http://127.0.0.1:8001",
            "category": "Internal Infrastructure",
            "description": "Audit local FastAPI and web proxy security headers and server disclosures."
        }
    ]
