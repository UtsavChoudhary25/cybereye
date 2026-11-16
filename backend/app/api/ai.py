from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.database import Investigation
from app.schemas.schemas import AIAnalyzeRequest, AIAnalyzeResponse, AISummaryRequest, AISummaryResponse
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

@router.post("/ai/analyze", response_model=AIAnalyzeResponse, tags=["AI Analyst"])
async def ai_analyze(req: AIAnalyzeRequest):
    return await AIService.analyze(
        query=req.query,
        target=req.target,
        context=req.context
    )

@router.post("/ai/summary", response_model=AISummaryResponse, tags=["AI Analyst"])
async def ai_summary(req: AISummaryRequest, db: Session = Depends(get_db)):
    inv = db.query(Investigation).filter(Investigation.id == req.investigation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    # Gather data for summary
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

    return await AIService.generate_summary(
        target=target,
        collected_data=collected_data,
        risk_data=risk_assessment.model_dump()
    )


