from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import datetime

from app.database.session import get_db
from app.models.database import Event
from app.schemas.schemas import EventResponse
from app.services.live_feed_service import live_feed_service

router = APIRouter()

@router.get("/events", response_model=List[EventResponse], tags=["Events"])
async def get_events(
    event_type: Optional[str] = Query(None, description="Filter by event type"),
    severity: Optional[str] = Query(None, description="Filter by severity (CRITICAL, HIGH, MEDIUM, LOW)"),
    status: Optional[str] = Query(None, description="Filter by status (active, resolved)"),
    limit: int = Query(60, ge=1, le=200),
    db: Session = Depends(get_db)
):
    query = db.query(Event)
    if event_type:
        query = query.filter(Event.type.ilike(f"%{event_type}%"))
    if severity:
        query = query.filter(Event.severity == severity.upper())
    if status:
        query = query.filter(Event.status == status)

    events = query.order_by(Event.timestamp.desc()).limit(limit).all()
    return events

@router.get("/events/stream", tags=["Events"])
async def stream_live_events():
    """Real-time Server-Sent Events (SSE) stream broadcasting live telemetry incidents."""
    return StreamingResponse(
        live_feed_service.subscribe(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@router.post("/events/sync", tags=["Events"])
async def trigger_live_sync():
    """Manually triggers an immediate pull from live USGS and CISA feeds."""
    await live_feed_service.ingest_live_feeds_to_db()
    return {"status": "ok", "message": "Live feed synchronization completed."}

@router.post("/events/simulate", tags=["Events"])
async def trigger_live_incident(db: Session = Depends(get_db)):
    """Simulates an immediate real-time cyber telemetry incident and broadcasts it."""
    incident = live_feed_service.generate_live_cyber_incident()
    ev_obj = Event(
        type=incident["type"],
        title=incident["title"],
        description=incident["description"],
        latitude=incident["latitude"],
        longitude=incident["longitude"],
        severity=incident["severity"],
        source=incident["source"],
        source_url=incident.get("source_url"),
        status="active",
        is_demo=False,
        metadata_json=incident.get("metadata_json", {}),
        timestamp=datetime.datetime.utcnow()
    )
    db.add(ev_obj)
    db.commit()
    db.refresh(ev_obj)

    out_dict = {
        "id": ev_obj.id,
        "type": ev_obj.type,
        "title": ev_obj.title,
        "description": ev_obj.description,
        "latitude": ev_obj.latitude,
        "longitude": ev_obj.longitude,
        "severity": ev_obj.severity,
        "source": ev_obj.source,
        "source_url": ev_obj.source_url,
        "status": ev_obj.status,
        "is_demo": ev_obj.is_demo,
        "timestamp": ev_obj.timestamp.isoformat(),
        "metadata_json": ev_obj.metadata_json,
    }
    await live_feed_service.broadcast_event(out_dict)
    return out_dict

@router.get("/events/{event_id}", response_model=EventResponse, tags=["Events"])
async def get_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event
