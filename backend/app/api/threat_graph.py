from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.database import Investigation, Relationship, Asset
from app.schemas.schemas import ThreatGraphResponse, GraphNode, GraphEdge

router = APIRouter()

@router.get("/threat-graph/{investigation_id}", response_model=ThreatGraphResponse, tags=["Threat Graph"])
async def get_threat_graph(investigation_id: int, db: Session = Depends(get_db)):
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    rels = db.query(Relationship).filter(Relationship.investigation_id == investigation_id).all()
    
    nodes_dict = {}
    edges = []

    # Ensure target node
    target_id = f"target_{inv.target}"
    nodes_dict[target_id] = GraphNode(
        id=target_id,
        label=inv.target,
        type="domain" if "." in inv.target else "org",
        category="Target",
        risk_score=inv.risk_score
    )

    for r in rels:
        if r.source_id not in nodes_dict:
            nodes_dict[r.source_id] = GraphNode(
                id=r.source_id,
                label=r.source_label,
                type=r.source_type,
                category="Infrastructure"
            )
        if r.target_id not in nodes_dict:
            nodes_dict[r.target_id] = GraphNode(
                id=r.target_id,
                label=r.target_label,
                type=r.target_type,
                category="Infrastructure"
            )
        edges.append(GraphEdge(
            source=r.source_id,
            target=r.target_id,
            relationship=r.relation_type,
            confidence=r.confidence
        ))

    return ThreatGraphResponse(
        investigation_id=inv.id,
        target=inv.target,
        nodes=list(nodes_dict.values()),
        edges=edges
    )
