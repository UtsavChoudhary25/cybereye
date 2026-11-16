from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database.session import get_db
from app.models.database import Vulnerability
from app.schemas.schemas import VulnerabilityResponse

router = APIRouter()

@router.get("/vulnerabilities", response_model=List[VulnerabilityResponse], tags=["Vulnerabilities"])
async def list_vulnerabilities(
    severity: Optional[str] = Query(None, description="CRITICAL, HIGH, MEDIUM, LOW"),
    search: Optional[str] = Query(None, description="Search CVE ID or software"),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(Vulnerability)
    if severity:
        query = query.filter(Vulnerability.severity == severity.upper())
    if search:
        query = query.filter(
            (Vulnerability.cve_id.ilike(f"%{search}%")) |
            (Vulnerability.title.ilike(f"%{search}%")) |
            (Vulnerability.affected_technology.ilike(f"%{search}%"))
        )
    return query.order_by(Vulnerability.cvss.desc()).limit(limit).all()

@router.get("/vulnerabilities/{cve_id}", response_model=VulnerabilityResponse, tags=["Vulnerabilities"])
async def get_vulnerability(cve_id: str, db: Session = Depends(get_db)):
    vuln = db.query(Vulnerability).filter(Vulnerability.cve_id == cve_id.upper()).first()
    if not vuln:
        raise HTTPException(status_code=404, detail="Vulnerability not found")
    return vuln
