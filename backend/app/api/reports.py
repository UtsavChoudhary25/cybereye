from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import Optional
from app.database.session import get_db
from app.models.database import Investigation, Report, User
from app.schemas.schemas import ReportCreate, ReportResponse
from app.api.deps import get_current_user_optional
from app.services.audit_service import audit_service, get_client_ip, get_user_agent_summary
from app.services.report_service import ReportService
from app.services.ai_service import AIService
from app.collectors import (
    DNSCollector, ASNCollector, CertificateCollector,
    TechnologyCollector, ReputationCollector, VulnerabilityCollector
)
from app.intelligence.risk_engine import RiskScoringEngine

router = APIRouter()

dns_c = DNSCollector()
asn_c = ASNCollector()
cert_c = CertificateCollector()
tech_c = TechnologyCollector()
rep_c = ReputationCollector()
vuln_c = VulnerabilityCollector()

@router.post("/reports", response_model=ReportResponse, tags=["Reports"])
async def generate_report(
    req: ReportCreate,
    request: Request,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    inv = db.query(Investigation).filter(Investigation.id == req.investigation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    # IDOR check: if investigation is owned by another user, deny report creation
    if inv.owner_id is not None:
        if not current_user or (current_user.id != inv.owner_id and current_user.role != "admin"):
            raise HTTPException(status_code=404, detail="Investigation not found")

    target = inv.target
    dns_res = await dns_c.collect(target)
    asn_res = await asn_c.collect(target)
    cert_res = await cert_c.collect(target)
    tech_res = await tech_c.collect(target)
    rep_res = await rep_c.collect(target)
    vuln_res = await vuln_c.collect(target)

    collected_data = {
        "dns": dns_res,
        "asn": asn_res,
        "certificate": cert_res,
        "tech": tech_res,
        "reputation": rep_res,
        "vuln": vuln_res
    }
    risk_assessment = RiskScoringEngine.calculate(target, collected_data)
    ai_sum = await AIService.generate_summary(target, collected_data, risk_assessment.model_dump())

    content = ReportService.generate_report_content(
        investigation_id=inv.id,
        target=target,
        collected_data=collected_data,
        risk_data=risk_assessment.model_dump(),
        ai_summary=ai_sum.model_dump()
    )

    title = req.title or f"CYBEREYE Executive Threat Dossier: {target}"
    report = Report(
        investigation_id=inv.id,
        owner_id=current_user.id if current_user else inv.owner_id,
        target=target,
        title=title,
        executive_summary=ai_sum.executive_summary,
        content_json=content
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    client_ip = get_client_ip(request)
    ua = get_user_agent_summary(request)
    audit_service.log_event(
        db=db,
        event_type="REPORT_GENERATED",
        severity="INFO",
        user_id=current_user.id if current_user else None,
        user_email=current_user.email if current_user else None,
        ip_address=client_ip,
        user_agent=ua,
        status="SUCCESS",
        details={"report_id": report.id, "target": target}
    )

    return report

@router.get("/reports/{report_id}", response_model=ReportResponse, tags=["Reports"])
async def get_report(
    report_id: int,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    rep = db.query(Report).filter(Report.id == report_id).first()
    if not rep:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # IDOR check
    if rep.owner_id is not None:
        if not current_user or (current_user.id != rep.owner_id and current_user.role != "admin"):
            raise HTTPException(status_code=404, detail="Report not found")

    return rep

@router.get("/reports/investigation/{inv_id}", response_model=ReportResponse, tags=["Reports"])
async def get_report_by_investigation(
    inv_id: int,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    inv = db.query(Investigation).filter(Investigation.id == inv_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="No report found for this investigation")
        
    if inv.owner_id is not None:
        if not current_user or (current_user.id != inv.owner_id and current_user.role != "admin"):
            raise HTTPException(status_code=404, detail="No report found for this investigation")

    rep = db.query(Report).filter(Report.investigation_id == inv_id).order_by(Report.created_at.desc()).first()
    if not rep:
        raise HTTPException(status_code=404, detail="No report found for this investigation")
    return rep

