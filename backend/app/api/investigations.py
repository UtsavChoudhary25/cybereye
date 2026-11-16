import asyncio
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from app.database.session import get_db
from app.models.database import Investigation, Asset, Relationship, User
from app.schemas.schemas import InvestigationCreate, InvestigationResponse
from app.api.deps import get_current_user_optional
from app.services.audit_service import audit_service, get_client_ip, get_user_agent_summary
from app.collectors import (
    DNSCollector, ASNCollector, CertificateCollector,
    TechnologyCollector, ReputationCollector, VulnerabilityCollector
)
from app.intelligence.risk_engine import RiskScoringEngine
from app.intelligence.graph_builder import ThreatGraphBuilder

router = APIRouter()

dns_collector = DNSCollector()
asn_collector = ASNCollector()
cert_collector = CertificateCollector()
tech_collector = TechnologyCollector()
rep_collector = ReputationCollector()
vuln_collector = VulnerabilityCollector()

@router.post("/investigations", tags=["Investigations"])
async def create_investigation(
    data: InvestigationCreate,
    request: Request,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    target = data.target.strip()
    if not target:
        raise HTTPException(status_code=400, detail="Target cannot be empty")

    # Safe Authorization Gate
    is_authorized = data.authorized_for_active_checks

    # Run collectors concurrently
    dns_res, asn_res, cert_res, tech_res, rep_res, vuln_res = await asyncio.gather(
        dns_collector.collect(target, is_active_authorized=is_authorized),
        asn_collector.collect(target, is_active_authorized=is_authorized),
        cert_collector.collect(target, is_active_authorized=is_authorized),
        tech_collector.collect(target, is_active_authorized=is_authorized),
        rep_collector.collect(target, is_active_authorized=is_authorized),
        vuln_collector.collect(target, is_active_authorized=is_authorized)
    )

    collected_data = {
        "dns": dns_res,
        "asn": asn_res,
        "certificate": cert_res,
        "tech": tech_res,
        "reputation": rep_res,
        "vuln": vuln_res
    }

    # Calculate transparent risk score
    risk_assessment = RiskScoringEngine.calculate(target, collected_data)

    # Persist investigation
    inv = Investigation(
        owner_id=current_user.id if current_user else None,
        target=target,
        target_type=data.target_type,
        status="completed",
        risk_score=risk_assessment.score,
        risk_level=risk_assessment.level,
        notes=data.notes or f"Automated OSINT investigation completed. Risk: {risk_assessment.level} ({risk_assessment.score}/100)."
    )
    db.add(inv)
    db.flush()

    # Build and persist Threat Graph relationships
    graph_bundle = ThreatGraphBuilder.build(target, collected_data, investigation_id=inv.id)
    for edge in graph_bundle.edges:
        rel = Relationship(
            investigation_id=inv.id,
            source_id=edge.source,
            source_type="node",
            source_label=edge.source,
            target_id=edge.target,
            target_type="node",
            target_label=edge.target,
            relation_type=edge.relationship,
            confidence=edge.confidence or 1.0
        )
        db.add(rel)

    # Persist Primary Discovered Asset
    asn_info = asn_res.get("data", {})
    dns_info = dns_res.get("data", {})
    a_records = dns_info.get("records", {}).get("A", [target if "." in target and not target.endswith(".com") else "198.51.100.24"])
    primary_ip = a_records[0] if a_records else "198.51.100.24"

    asset = Asset(
        investigation_id=inv.id,
        hostname=f"host.{target}",
        ip=primary_ip,
        domain=target if "." in target else None,
        organization=asn_info.get("organization", "Discovered Organization"),
        country=asn_info.get("country", "Unknown"),
        country_code=asn_info.get("country_code", "UN"),
        latitude=asn_info.get("latitude", 0.0),
        longitude=asn_info.get("longitude", 0.0),
        asn=asn_info.get("asn", "AS-Unknown"),
        technology=tech_res.get("data", {}).get("technologies", []),
        risk_score=risk_assessment.score
    )
    db.add(asset)
    db.commit()
    db.refresh(inv)

    # Audit Logging
    client_ip = get_client_ip(request)
    ua = get_user_agent_summary(request)
    audit_service.log_event(
        db=db,
        event_type="INVESTIGATION_CREATED",
        severity="INFO",
        user_id=current_user.id if current_user else None,
        user_email=current_user.email if current_user else None,
        ip_address=client_ip,
        user_agent=ua,
        status="SUCCESS",
        details={
            "investigation_id": inv.id,
            "target": target,
            "risk_score": inv.risk_score,
            "risk_level": inv.risk_level
        }
    )

    return {
        "investigation_id": inv.id,
        "target": inv.target,
        "target_type": inv.target_type,
        "status": inv.status,
        "created_at": inv.created_at,
        "risk_assessment": risk_assessment,
        "intelligence": collected_data,
        "threat_graph": graph_bundle,
        "asset": {
            "id": asset.id,
            "ip": asset.ip,
            "organization": asset.organization,
            "country": asset.country,
            "asn": asset.asn,
            "technology": asset.technology
        }
    }

@router.get("/investigations", tags=["Investigations"])
async def list_investigations(
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    query = db.query(Investigation)
    
    if current_user and current_user.role == "admin":
        # Admin can view all investigations
        pass
    elif current_user:
        # Standard user: only see their own investigations or public demo templates
        query = query.filter((Investigation.owner_id == current_user.id) | (Investigation.owner_id == None))
    else:
        # Unauthenticated / guest: only public demo templates
        query = query.filter(Investigation.owner_id == None)

    invs = query.order_by(Investigation.created_at.desc()).all()
    results = []
    for inv in invs:
        assets_count = len(inv.assets)
        results.append({
            "id": inv.id,
            "target": inv.target,
            "target_type": inv.target_type,
            "status": inv.status,
            "risk_score": inv.risk_score,
            "risk_level": inv.risk_level,
            "notes": inv.notes,
            "created_at": inv.created_at,
            "updated_at": inv.updated_at,
            "assets_count": assets_count
        })
    return results

@router.get("/investigations/{investigation_id}", tags=["Investigations"])
async def get_investigation_detail(
    investigation_id: int,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")
    
    # IDOR Protection: If investigation is owned by a user, enforce ownership or admin role
    if inv.owner_id is not None:
        if not current_user or (current_user.id != inv.owner_id and current_user.role != "admin"):
            raise HTTPException(status_code=404, detail="Investigation not found")

    # Re-build graph and intelligence for detail view
    rels = db.query(Relationship).filter(Relationship.investigation_id == investigation_id).all()
    assets = db.query(Asset).filter(Asset.investigation_id == investigation_id).all()

    return {
        "id": inv.id,
        "target": inv.target,
        "target_type": inv.target_type,
        "status": inv.status,
        "risk_score": inv.risk_score,
        "risk_level": inv.risk_level,
        "notes": inv.notes,
        "created_at": inv.created_at,
        "assets": [
            {
                "id": a.id,
                "ip": a.ip,
                "domain": a.domain,
                "organization": a.organization,
                "country": a.country,
                "latitude": a.latitude,
                "longitude": a.longitude,
                "asn": a.asn,
                "technology": a.technology,
                "risk_score": a.risk_score
            }
            for a in assets
        ],
        "relationships_count": len(rels)
    }

