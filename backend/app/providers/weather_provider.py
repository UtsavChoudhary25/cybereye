import datetime
from typing import Dict, Any, List, Optional
import httpx
from app.providers.base import DataProvider
from app.core.logging import logger

class WeatherProvider(DataProvider):
    """
    Ingests live meteorological and atmospheric intelligence from Open-Meteo API.
    Zero API key required; open public science data.
    Provides weather telemetry for major global transit and data center regions.
    """
    OBSERVATION_NODES = [
        {"city": "Frankfurt", "lat": 50.1109, "lon": 8.6821, "country": "DE"},
        {"city": "Tokyo", "lat": 35.6762, "lon": 139.6503, "country": "JP"},
        {"city": "London", "lat": 51.5074, "lon": -0.1278, "country": "GB"},
        {"city": "New York", "lat": 40.7128, "lon": -74.0060, "country": "US"},
        {"city": "Singapore", "lat": 1.3521, "lon": 103.8198, "country": "SG"},
        {"city": "Sydney", "lat": -33.8688, "lon": 151.2093, "country": "AU"},
    ]

    def __init__(self):
        super().__init__(
            name="Open-Meteo Weather & Geosphere API",
            category="Atmospheric Intelligence",
            docs_url="https://open-meteo.com/en/docs",
            cache_ttl_seconds=300
        )

    async def fetch(self) -> List[Dict[str, Any]]:
        readings = []
        async with httpx.AsyncClient(timeout=6.0) as client:
            for node in self.OBSERVATION_NODES:
                try:
                    url = f"https://api.open-meteo.com/v1/forecast?latitude={node['lat']}&longitude={node['lon']}&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m"
                    resp = await client.get(url)
                    if resp.status_code == 200:
                        data = resp.json()
                        data["node"] = node
                        readings.append(data)
                except Exception as e:
                    logger.debug(f"Open-Meteo node {node['city']} fetch error: {e}")
        return readings

    def normalize(self, raw_data: Any) -> List[Dict[str, Any]]:
        results = []
        if not isinstance(raw_data, list):
            return results

        now = datetime.datetime.utcnow()
        for item in raw_data:
            node = item.get("node", {})
            cur = item.get("current", {})
            temp = cur.get("temperature_2m", 20.0)
            wind = cur.get("wind_speed_10m", 5.0)
            pressure = cur.get("surface_pressure", 1013.2)

            is_severe = wind >= 35.0 or temp >= 42.0 or temp <= -15.0
            sev = "HIGH" if is_severe else "LOW"

            results.append({
                "type": "Natural event",
                "title": f"Atmospheric Telemetry: {node.get('city')} ({temp:.1f}°C)",
                "description": f"Current weather observations: Temperature {temp:.1f}°C, Wind Speed {wind:.1f} km/h, Barometric Pressure {pressure:.1f} hPa.",
                "latitude": node.get("lat"),
                "longitude": node.get("lon"),
                "severity": sev,
                "source": "Open-Meteo Open Science API",
                "source_url": "https://open-meteo.com",
                "status": "active",
                "is_demo": False,
                "timestamp": now,
                "metadata_json": {
                    "layer": "weather",
                    "temperature_c": temp,
                    "wind_kmh": wind,
                    "pressure_hpa": pressure,
                    "city": node.get("city")
                }
            })
        return results
