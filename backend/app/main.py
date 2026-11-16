from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.config import settings
from app.core.logging import logger
from app.database.session import Base, engine, SessionLocal, ensure_schema_migrations
from app.core.seed_data import seed_database
from app.services.live_feed_service import live_feed_service
from app.providers.manager import provider_manager
from app.api import (
    health_router,
    events_router,
    investigations_router,
    intelligence_router,
    assets_router,
    vulnerabilities_router,
    threat_graph_router,
    risk_score_router,
    ai_router,
    reports_router,
    datasources_router,
    scanner_router,
    auth_router,
    admin_router,
    security_info_router
)

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Enforces essential defensive HTTP security headers on all responses."""
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        if settings.ENV == "production":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing CyberEye database tables...")
    Base.metadata.create_all(bind=engine)
    ensure_schema_migrations()
    db = SessionLocal()
    try:
        seed_database(db)
        logger.info("CyberEye demo database seeded successfully.")
    except Exception as e:
        logger.error(f"Error seeding database: {e}")
    finally:
        db.close()
    
    # Sync real-world cyber providers (USGS, CISA, Open-Meteo)
    try:
        logger.info("Synchronizing real-world cyber data providers...")
        await provider_manager.sync_all_to_database()
    except Exception as e:
        logger.warning(f"Initial provider sync warning: {e}")

    # Start live background feed streaming worker
    logger.info("Starting CyberEye Real-Time Live Telemetry Engine...")
    live_feed_service.start_background_worker()
    logger.info("CyberEye Backend Engine Ready.")

    yield

    logger.info("Stopping CyberEye Live Telemetry Engine...")
    live_feed_service.stop_background_worker()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=settings.DESCRIPTION,
    lifespan=lifespan
)

# Apply Security Headers Middleware
app.add_middleware(SecurityHeadersMiddleware)

# Configure CORS with security boundaries
cors_origins = [o for o in settings.CORS_ORIGINS if o != "*"] if settings.ENV == "production" else settings.CORS_ORIGINS
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins if cors_origins else ["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_origin_regex=r"https://.*(\.pages\.dev|\.vercel\.app|\.netlify\.app)",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["Retry-After"]
)

# Register API Routers
app.include_router(health_router, prefix=settings.API_V1_STR)
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(admin_router, prefix=settings.API_V1_STR)
app.include_router(security_info_router, prefix=settings.API_V1_STR)
app.include_router(events_router, prefix=settings.API_V1_STR)
app.include_router(investigations_router, prefix=settings.API_V1_STR)
app.include_router(intelligence_router, prefix=settings.API_V1_STR)
app.include_router(assets_router, prefix=settings.API_V1_STR)
app.include_router(vulnerabilities_router, prefix=settings.API_V1_STR)
app.include_router(threat_graph_router, prefix=settings.API_V1_STR)
app.include_router(risk_score_router, prefix=settings.API_V1_STR)
app.include_router(ai_router, prefix=settings.API_V1_STR)
app.include_router(reports_router, prefix=settings.API_V1_STR)
app.include_router(datasources_router, prefix=settings.API_V1_STR)
app.include_router(scanner_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {
        "message": "CYBEREYE — AI-Powered Cyber Intelligence & OSINT Platform",
        "tagline": "See the signal. Understand the threat.",
        "status": "ONLINE",
        "documentation": "/docs",
        "api_prefix": settings.API_V1_STR
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8001, reload=True)
