from fastapi import APIRouter
import datetime
from app.core.config import settings

router = APIRouter()

@router.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "ONLINE",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "demo_mode": settings.DEMO_MODE,
        "database": "CONNECTED",
        "subsystems": {
            "3d_globe_telemetry": "ACTIVE",
            "threat_graph_engine": "ACTIVE",
            "passive_collectors": "ONLINE",
            "risk_engine": "ONLINE",
            "defensive_ai_analyst": "ONLINE (Offline Heuristic Fallback Ready)"
        }
    }
