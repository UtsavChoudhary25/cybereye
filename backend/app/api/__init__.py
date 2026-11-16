from app.api.health import router as health_router
from app.api.events import router as events_router
from app.api.investigations import router as investigations_router
from app.api.intelligence import router as intelligence_router
from app.api.assets import router as assets_router
from app.api.vulnerabilities import router as vulnerabilities_router
from app.api.threat_graph import router as threat_graph_router
from app.api.risk_score import router as risk_score_router
from app.api.ai import router as ai_router
from app.api.reports import router as reports_router
from app.api.datasources import router as datasources_router
from app.api.web_scanner import router as scanner_router
from app.api.auth import router as auth_router
from app.api.admin import router as admin_router
from app.api.security_info import router as security_info_router

__all__ = [
    "health_router",
    "events_router",
    "investigations_router",
    "intelligence_router",
    "assets_router",
    "vulnerabilities_router",
    "threat_graph_router",
    "risk_score_router",
    "ai_router",
    "reports_router",
    "datasources_router",
    "scanner_router",
    "auth_router",
    "admin_router",
    "security_info_router"
]
