import datetime
from sqlalchemy.orm import Session
from app.models.database import Event, Asset, Vulnerability, DataSource, Investigation, Relationship

def seed_database(db: Session):
    # Only seed if empty
    if db.query(Event).first():
        return

    now = datetime.datetime.utcnow()

    # 1. Global Events (with geospatial coordinates for 3D Globe)
    events_data = [
        # --- Cyber Events Layer ---
        {
            "type": "Cybersecurity",
            "title": "Volumetric DDoS Botnet Swarm Targeting Financial Hub",
            "description": "Massive 850 Gbps SYN/ACK flood detected targeting transit providers in Frankfurt financial exchange. Attack traffic originated from compromised IoT botnet nodes.",
            "latitude": 50.1109,
            "longitude": 8.6821,
            "severity": "CRITICAL",
            "source": "Global BGP Flow Telemetry",
            "source_url": "https://radar.cloudflare.com",
            "status": "active",
            "metadata_json": {
                "layer": "cyber",
                "attack_vector": "SYN-Flood",
                "target_sector": "Finance",
                "origin_lat": 31.2304,
                "origin_lon": 121.4737,
                "origin_city": "Shanghai",
                "target_city": "Frankfurt",
                "volume_gbps": 850
            },
            "is_demo": True
        },
        {
            "type": "Cybersecurity",
            "title": "BlackBasta Ransomware Exfiltration Campaign",
            "description": "Credential abuse and lateral movement observed targeting healthcare providers across East Coast health network.",
            "latitude": 40.7128,
            "longitude": -74.0060,
            "severity": "HIGH",
            "source": "CISA Cybersecurity Advisory",
            "source_url": "https://www.cisa.gov/news-events/cybersecurity-advisories",
            "status": "active",
            "metadata_json": {
                "layer": "cyber",
                "malware_family": "BlackBasta",
                "target_sector": "Healthcare",
                "cve_targeted": "CVE-2024-24919",
                "target_city": "New York"
            },
            "is_demo": True
        },
        {
            "type": "Cybersecurity",
            "title": "State-Sponsored Phishing Cluster Spearphishing Diplomatic Mission",
            "description": "Sophisticated HTML smuggling campaign using weaponized PDF invoices targeting embassies in Brussels.",
            "latitude": 50.8503,
            "longitude": 4.3517,
            "severity": "HIGH",
            "source": "CERT-EU Threat Telemetry",
            "source_url": "https://cert.europa.eu",
            "status": "active",
            "metadata_json": {
                "layer": "cyber",
                "threat_actor": "APT29 Cluster",
                "target_sector": "Government / Diplomatic",
                "target_city": "Brussels"
            },
            "is_demo": True
        },
        {
            "type": "Cybersecurity",
            "title": "Credential Stuffing Barrage on Cloud Identity Providers",
            "description": "Over 12 million automated password replay attempts originating from residential proxy networks targeting Tokyo SaaS portals.",
            "latitude": 35.6762,
            "longitude": 139.6503,
            "severity": "MEDIUM",
            "source": "Public Threat Intelligence Consortium",
            "status": "active",
            "metadata_json": {
                "layer": "cyber",
                "target_sector": "Identity & SaaS",
                "attack_vector": "Credential-Stuffing",
                "target_city": "Tokyo"
            },
            "is_demo": True
        },

        # --- Infrastructure Layer ---
        {
            "type": "Infrastructure",
            "title": "Transatlantic Submarine Cable Segment Disruption",
            "description": "Physical fiber repeater malfunction detected on SEA-ME-WE 5 landing corridor near Alexandria, rerouting 3.4 Tbps of Mediterranean traffic.",
            "latitude": 31.2001,
            "longitude": 29.9187,
            "severity": "HIGH",
            "source": "TeleGeography Submarine Cable Map Feed",
            "source_url": "https://www.submarinecablemap.com",
            "status": "active",
            "metadata_json": {
                "layer": "infrastructure",
                "cable_name": "SEA-ME-WE 5",
                "impact": "Latency +42ms via Red Sea route",
                "station": "Abu Talat Landing Station"
            },
            "is_demo": True
        },
        {
            "type": "Infrastructure",
            "title": "Major BGP Route Leak Affecting Latin America IXP",
            "description": "Errant route announcement from regional autonomous system led to traffic blackholing for 14 ISPs in São Paulo.",
            "latitude": -23.5505,
            "longitude": -46.6333,
            "severity": "MEDIUM",
            "source": "BGPmon Route Monitoring",
            "status": "active",
            "metadata_json": {
                "layer": "infrastructure",
                "asn_affected": "AS27699",
                "leaked_prefixes": 4820,
                "city": "São Paulo"
            },
            "is_demo": True
        },
        {
            "type": "Infrastructure",
            "title": "Hyperscale Cloud Data Center Power Anomaly",
            "description": "Partial utility grid failure in Ashburn Virginia corridor triggered secondary diesel generator transfer with isolated zone packet drop.",
            "latitude": 39.0438,
            "longitude": -77.4874,
            "severity": "LOW",
            "source": "Public Cloud Health Dashboard",
            "status": "resolved",
            "metadata_json": {
                "layer": "infrastructure",
                "facility": "US-East Data Center Hub",
                "city": "Ashburn"
            },
            "is_demo": True
        },

        # --- Natural Event Layer ---
        {
            "type": "Natural event",
            "title": "M6.4 Earthquake — Pacific Rim Telecommunication Check",
            "description": "Shallow offshore seismic tremor near Sendai Japan. Monitoring coastal fiber landing stations and critical infrastructure.",
            "latitude": 38.2682,
            "longitude": 140.8694,
            "severity": "MEDIUM",
            "source": "USGS Earthquake Hazards Program (Public Feed)",
            "source_url": "https://earthquake.usgs.gov",
            "status": "active",
            "metadata_json": {
                "layer": "earthquakes",
                "magnitude": 6.4,
                "depth_km": 24.5,
                "region": "Honshu, Japan"
            },
            "is_demo": True
        },
        {
            "type": "Natural event",
            "title": "M5.8 Seismic Tremor — Southern California Fault Line",
            "description": "Seismic activity recorded along San Jacinto Fault zone. Structural health telemetry active for data center facilities.",
            "latitude": 33.7222,
            "longitude": -116.7139,
            "severity": "LOW",
            "source": "USGS Earthquake Hazards Program",
            "status": "active",
            "metadata_json": {
                "layer": "earthquakes",
                "magnitude": 5.8,
                "depth_km": 12.0,
                "region": "Idyllwild, California"
            },
            "is_demo": True
        },

        # --- Weather Events Layer ---
        {
            "type": "Natural event",
            "title": "Category 4 Cyclone Approaching Bay of Bengal",
            "description": "Severe cyclonic storm generating storm surges along coastal Odisha and Chittagong. Redundant microwave backhauls placed on standby.",
            "latitude": 20.9517,
            "longitude": 86.8200,
            "severity": "HIGH",
            "source": "World Meteorological Organization Open Alert",
            "status": "active",
            "metadata_json": {
                "layer": "weather",
                "category": "Cyclone Stage 4",
                "wind_speed_kmh": 210,
                "region": "Bay of Bengal"
            },
            "is_demo": True
        },

        # --- Maritime / Transport Data Layer ---
        {
            "type": "Public intelligence",
            "title": "Cable Repair Ship Dispatched to North Sea Corridor",
            "description": "Specialized cable laying and repair vessel CS Sovereign en route to investigate North Sea subsea link anomaly.",
            "latitude": 54.5000,
            "longitude": 2.5000,
            "severity": "LOW",
            "source": "Public Automatic Identification System (AIS) Tracker",
            "status": "active",
            "metadata_json": {
                "layer": "maritime",
                "vessel_name": "C.S. Sovereign",
                "mmsi": "232004270",
                "status": "Underway Using Engine"
            },
            "is_demo": True
        },

        # --- Threat Intelligence Feed Layer ---
        {
            "type": "Vulnerability",
            "title": "Critical RCE Disclosed in Edge VPN Appliances",
            "description": "Emergency advisory issued for unauthenticated path traversal leading to code execution on enterprise edge gateways.",
            "latitude": 37.7749,
            "longitude": -122.4194,
            "severity": "CRITICAL",
            "source": "NVD Vulnerability Feed",
            "source_url": "https://nvd.nist.gov/vuln/detail/CVE-2024-24919",
            "status": "active",
            "metadata_json": {
                "layer": "threat",
                "cve_id": "CVE-2024-24919",
                "cvss": 9.8,
                "affected_devices": "18,400 worldwide"
            },
            "is_demo": True
        },
        {
            "type": "Public intelligence",
            "title": "Disinformation & Botnet Sybil Network Takedown",
            "description": "Collaborative seizure of 32 rogue domain controllers spreading coordinated malicious lure domains across Eastern Europe.",
            "latitude": 52.2297,
            "longitude": 21.0122,
            "severity": "LOW",
            "source": "Europol Cybercrime Centre (EC3)",
            "status": "resolved",
            "metadata_json": {
                "layer": "threat",
                "domains_seized": 32,
                "city": "Warsaw"
            },
            "is_demo": True
        }
    ]

    for idx, ev_data in enumerate(events_data):
        # Stagger recent event timestamps dynamically from 2m ago up to recent hours
        delta_minutes = 2 + int(idx * 3.5 + (idx % 4) * 2)
        event_time = now - datetime.timedelta(minutes=delta_minutes)
        event = Event(
            type=ev_data["type"],
            title=ev_data["title"],
            description=ev_data["description"],
            latitude=ev_data["latitude"],
            longitude=ev_data["longitude"],
            severity=ev_data["severity"],
            timestamp=event_time,
            source=ev_data["source"],
            source_url=ev_data.get("source_url"),
            status=ev_data["status"],
            metadata_json=ev_data["metadata_json"],
            is_demo=ev_data["is_demo"]
        )
        db.add(event)

    # 2. Demo Data Sources Status
    sources = [
        {"name": "National Vulnerability Database (NVD)", "category": "Vulnerability", "status": "ONLINE", "is_demo": True, "description": "NIST public CVE disclosures, CVSS scores, and CWE categorizations.", "docs_url": "https://nvd.nist.gov"},
        {"name": "Cloudflare Radar / DNS Public Feed", "category": "DNS & Network", "status": "ONLINE", "is_demo": False, "description": "Public recursive DNS telemetry and global Internet traffic trends.", "docs_url": "https://radar.cloudflare.com"},
        {"name": "USGS Earthquake Hazard API", "category": "Geospatial", "status": "ONLINE", "is_demo": False, "description": "Real-time planetary seismic event telemetry.", "docs_url": "https://earthquake.usgs.gov"},
        {"name": "Shodan Internet Intelligence", "category": "Port & Banner Exposure", "status": "DEMO_MODE", "is_demo": True, "description": "Requires SHODAN_API_KEY in .env. Currently operating on realistic synthetic demo telemetry.", "docs_url": "https://www.shodan.io"},
        {"name": "VirusTotal Threat Engine", "category": "Threat Reputation", "status": "DEMO_MODE", "is_demo": True, "description": "Requires VIRUSTOTAL_API_KEY in .env. Currently utilizing CyberEye demo blocklist fixtures.", "docs_url": "https://www.virustotal.com"},
        {"name": "BGP Routing & PeeringDB", "category": "Autonomous Systems", "status": "ONLINE", "is_demo": False, "description": "Global BGP routing tables, ASN registries, and IXP interconnect metadata.", "docs_url": "https://peeringdb.com"},
        {"name": "Public Subsea Cable Registry", "category": "Infrastructure", "status": "ONLINE", "is_demo": True, "description": "TeleGeography public submarine fiber landing points and routing paths.", "docs_url": "https://www.submarinecablemap.com"}
    ]

    for s in sources:
        ds = DataSource(
            name=s["name"],
            category=s["category"],
            status=s["status"],
            is_demo=s["is_demo"],
            last_sync=now,
            description=s["description"],
            docs_url=s["docs_url"]
        )
        db.add(ds)

    # 3. Seed Demo Vulnerabilities
    cves = [
        {"cve_id": "CVE-2024-24919", "title": "Check Point / Gateway Information Disclosure", "description": "Zero-day vulnerability allowing unauthenticated remote attackers to read arbitrary files via improperly sanitized VPN portal paths.", "severity": "CRITICAL", "cvss": 9.8, "published_date": "2024-05-28", "affected_technology": "Security Gateways / Proxies", "reference": "https://nvd.nist.gov/vuln/detail/CVE-2024-24919"},
        {"cve_id": "CVE-2023-44487", "title": "HTTP/2 Rapid Reset DDoS Condition", "description": "Protocol-level flaw in HTTP/2 request stream handling permitting denial of service exploitation.", "severity": "HIGH", "cvss": 7.5, "published_date": "2023-10-10", "affected_technology": "HTTP/2 Web Servers", "reference": "https://nvd.nist.gov/vuln/detail/CVE-2023-44487"},
        {"cve_id": "CVE-2024-38475", "title": "Apache HTTP Server mod_rewrite Filter Escape", "description": "Improper escaping allows bypass of mapping architecture in rewrite configurations.", "severity": "MEDIUM", "cvss": 6.3, "published_date": "2024-06-18", "affected_technology": "Apache HTTP Server <= 2.4.59", "reference": "https://nvd.nist.gov/vuln/detail/CVE-2024-38475"},
        {"cve_id": "CVE-2024-22243", "title": "Spring Framework URL Parsing SSRF Vulnerability", "description": "UriComponentsBuilder parser flaw enables potential open redirect or server-side request forgery.", "severity": "HIGH", "cvss": 8.1, "published_date": "2024-02-22", "affected_technology": "Spring Framework 6.1.x", "reference": "https://nvd.nist.gov/vuln/detail/CVE-2024-22243"}
    ]
    for c in cves:
        v = Vulnerability(
            cve_id=c["cve_id"],
            title=c["title"],
            description=c["description"],
            severity=c["severity"],
            cvss=c["cvss"],
            published_date=c["published_date"],
            affected_technology=c["affected_technology"],
            reference=c["reference"]
        )
        db.add(v)

    # 4. Seed a Sample Investigation for Acme Defense
    inv = Investigation(
        target="acme-defense.org",
        target_type="domain",
        status="completed",
        risk_score=76,
        risk_level="HIGH",
        notes="Automated baseline passive OSINT assessment conducted. Critical perimeter exposure detected.",
        created_at=now - datetime.timedelta(hours=2)
    )
    db.add(inv)
    db.flush()

    # Add associated asset
    asset1 = Asset(
        investigation_id=inv.id,
        hostname="portal.acme-defense.org",
        ip="198.51.100.24",
        domain="acme-defense.org",
        organization="Acme Global Defense Systems",
        country="United States",
        country_code="US",
        latitude=38.9687,
        longitude=-77.3411,
        asn="AS40012",
        technology=["nginx/1.24.0", "ModSecurity v3", "FastAPI", "React 19"],
        risk_score=76,
        last_seen=now
    )
    db.add(asset1)

    # Add Relationships for Threat Graph
    rels = [
        {"s_id": "target_acme-defense.org", "s_type": "domain", "s_lbl": "acme-defense.org", "t_id": "ip_198.51.100.24", "t_type": "ip", "t_lbl": "198.51.100.24", "rel": "resolves_to"},
        {"s_id": "ip_198.51.100.24", "s_type": "ip", "s_lbl": "198.51.100.24", "t_id": "asn_AS40012", "t_type": "asn", "t_lbl": "AS40012 (ACME-DEFENSE)", "rel": "belongs_to"},
        {"s_id": "asn_AS40012", "s_type": "asn", "s_lbl": "AS40012", "t_id": "org_Acme_Defense", "t_type": "org", "t_lbl": "Acme Global Defense Systems", "rel": "managed_by"},
        {"s_id": "target_acme-defense.org", "s_type": "domain", "s_lbl": "acme-defense.org", "t_id": "cve_CVE-2024-24919", "t_type": "cve", "t_lbl": "CVE-2024-24919 (CVSS 9.8)", "rel": "affected_by"}
    ]
    for r in rels:
        rel = Relationship(
            investigation_id=inv.id,
            source_id=r["s_id"],
            source_type=r["s_type"],
            source_label=r["s_lbl"],
            target_id=r["t_id"],
            target_type=r["t_type"],
            target_label=r["t_lbl"],
            relation_type=r["rel"],
            confidence=0.95
        )
        db.add(rel)

    db.commit()
