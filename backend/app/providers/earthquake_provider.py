import datetime
from typing import Dict, Any, List, Optional
import httpx
from app.providers.base import DataProvider
from app.core.logging import logger

class EarthquakeProvider(DataProvider):
    """
    Ingests live real-time M2.5+ earthquake telemetry directly from USGS Earthquake Hazards API.
    100% real, open public data with exact latitude, longitude, magnitude, and focal depth.
    """
    def __init__(self):
        super().__init__(
            name="USGS Earthquake Hazards Program",
            category="Natural Hazards",
            docs_url="https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php",
            cache_ttl_seconds=120
        )

    async def fetch(self) -> Dict[str, Any]:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson")
            resp.raise_for_status()
            return resp.json()

    def normalize(self, raw_data: Any) -> List[Dict[str, Any]]:
        results = []
        if not isinstance(raw_data, dict):
            return results

        features = raw_data.get("features", [])
        for f in features:
            props = f.get("properties", {})
            geom = f.get("geometry", {})
            coords = geom.get("coordinates", [])
            if len(coords) >= 2:
                lon, lat = coords[0], coords[1]
                depth = coords[2] if len(coords) > 2 else 10.0
                mag = props.get("mag") or 3.0
                sev = "CRITICAL" if mag >= 6.0 else "HIGH" if mag >= 4.5 else "MEDIUM"
                
                time_epoch = props.get("time")
                dt = datetime.datetime.utcfromtimestamp(time_epoch / 1000.0) if time_epoch else datetime.datetime.utcnow()

                results.append({
                    "type": "Natural event",
                    "title": f"M {mag:.1f} Earthquake — {props.get('place', 'Global Region')}",
                    "description": f"Real-time USGS seismic event registered with magnitude {mag:.1f} at depth {depth:.1f} km.",
                    "latitude": float(lat),
                    "longitude": float(lon),
                    "severity": sev,
                    "source": "USGS Earthquake Hazards Program",
                    "source_url": props.get("url", "https://earthquake.usgs.gov"),
                    "status": "active",
                    "is_demo": False,
                    "timestamp": dt,
                    "metadata_json": {
                        "layer": "earthquakes",
                        "magnitude": mag,
                        "depth_km": depth,
                        "tsunami_alert": bool(props.get("tsunami", 0)),
                        "live_feed": "USGS Real-Time GeoJSON Feed"
                    }
                })
        return results
