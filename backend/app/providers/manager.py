import asyncio
import datetime
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session

from app.providers.base import DataProvider
from app.providers.earthquake_provider import EarthquakeProvider
from app.providers.vulnerability_provider import VulnerabilityProvider
from app.providers.weather_provider import WeatherProvider
from app.models.database import Event, Vulnerability, DataSource
from app.database.session import SessionLocal
from app.core.logging import logger

class ProviderManager:
    """
    Central coordinator for CyberEye real cyber intelligence data providers.
    Manages registration, lifecycle, caching, database persistence, and status aggregation.
    """
    def __init__(self):
        self.providers: Dict[str, DataProvider] = {
            "earthquakes": EarthquakeProvider(),
            "vulnerabilities": VulnerabilityProvider(),
            "weather": WeatherProvider(),
        }

    def get_provider(self, key: str) -> Optional[DataProvider]:
        return self.providers.get(key)

    def get_all_statuses(self) -> List[Dict[str, Any]]:
        """Returns health status for all registered real data providers."""
        return [p.get_status() for p in self.providers.values()]

    async def sync_all_to_database(self):
        """
        Pulls fresh real-world data from all cyber and hazard providers and upserts into local SQLite database.
        Runs gracefully without crashing if any external provider is unreachable.
        """
        logger.info("Synchronizing cyber data providers to CyberEye database...")
        db: Session = SessionLocal()
        try:
            # 1. Sync Earthquakes (USGS)
            eq_provider = self.providers["earthquakes"]
            eq_events = await eq_provider.get_data()
            for ev in eq_events:
                existing_ev = db.query(Event).filter(Event.title == ev["title"]).first()
                if not existing_ev:
                    db.add(Event(**ev))

            # 2. Sync Weather Events (Open-Meteo)
            wx_provider = self.providers["weather"]
            wx_events = await wx_provider.get_data()
            for ev in wx_events:
                existing_ev = db.query(Event).filter(Event.title == ev["title"]).first()
                if not existing_ev:
                    db.add(Event(**ev))

            # 3. Sync Vulnerabilities (CISA KEV / NVD)
            vuln_provider = self.providers["vulnerabilities"]
            vuln_items = await vuln_provider.get_data()
            for v in vuln_items:
                cve_id = v.get("cve_id")
                existing_v = db.query(Vulnerability).filter(Vulnerability.cve_id == cve_id).first()
                if not existing_v:
                    db.add(Vulnerability(
                        cve_id=v["cve_id"],
                        title=v["title"],
                        description=v["description"],
                        severity=v["severity"],
                        cvss=v["cvss"],
                        published_date=v.get("published_date"),
                        affected_technology=v.get("affected_technology"),
                        reference=v.get("reference")
                    ))

            # 4. Update DataSource Table with Live Status
            for status in self.get_all_statuses():
                ds = db.query(DataSource).filter(DataSource.name == status["name"]).first()
                if ds:
                    ds.status = status["status"]
                    ds.last_sync = datetime.datetime.utcnow()
                    ds.description = status["message"]
                else:
                    db.add(DataSource(
                        name=status["name"],
                        category=status["category"],
                        status=status["status"],
                        is_demo=not status["is_configured"],
                        last_sync=datetime.datetime.utcnow(),
                        description=status["message"],
                        docs_url=status["docs_url"]
                    ))

            db.commit()
            logger.info("Successfully completed cyber data synchronization.")
        except Exception as e:
            logger.error(f"Error during cyber data synchronization: {e}")
            db.rollback()
        finally:
            db.close()

# Global Singleton Manager
provider_manager = ProviderManager()

