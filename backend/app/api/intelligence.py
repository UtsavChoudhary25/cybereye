from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from app.collectors import DNSCollector, ASNCollector, CertificateCollector, TechnologyCollector, ReputationCollector, VulnerabilityCollector

router = APIRouter()

dns_collector = DNSCollector()
asn_collector = ASNCollector()
cert_collector = CertificateCollector()
tech_collector = TechnologyCollector()
rep_collector = ReputationCollector()
vuln_collector = VulnerabilityCollector()

class IntelRequest(BaseModel):
    target: str
    authorized_for_active_checks: bool = False

@router.post("/intelligence/domain", tags=["Intelligence"])
async def query_domain_intel(req: IntelRequest):
    target = req.target.strip()
    if not target:
        raise HTTPException(status_code=400, detail="Domain target cannot be empty")

    dns_res = await dns_collector.collect(target, is_active_authorized=req.authorized_for_active_checks)
    cert_res = await cert_collector.collect(target, is_active_authorized=req.authorized_for_active_checks)
    tech_res = await tech_collector.collect(target, is_active_authorized=req.authorized_for_active_checks)
    rep_res = await rep_collector.collect(target, is_active_authorized=req.authorized_for_active_checks)
    vuln_res = await vuln_collector.collect(target, is_active_authorized=req.authorized_for_active_checks)

    return {
        "target": target,
        "dns": dns_res,
        "certificate": cert_res,
        "technology": tech_res,
        "reputation": rep_res,
        "vulnerabilities": vuln_res
    }

@router.post("/intelligence/ip", tags=["Intelligence"])
async def query_ip_intel(req: IntelRequest):
    target = req.target.strip()
    if not target:
        raise HTTPException(status_code=400, detail="IP target cannot be empty")

    asn_res = await asn_collector.collect(target, is_active_authorized=req.authorized_for_active_checks)
    rep_res = await rep_collector.collect(target, is_active_authorized=req.authorized_for_active_checks)
    vuln_res = await vuln_collector.collect(target, is_active_authorized=req.authorized_for_active_checks)

    return {
        "target": target,
        "asn": asn_res,
        "reputation": rep_res,
        "vulnerabilities": vuln_res
    }
