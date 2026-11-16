# CYBEREYE REST API Specifications

The CyberEye backend exposes a standardized RESTful API under `/api`.

---

## 1. System Endpoints

### `GET /api/health`
Checks operational status of the platform and internal subsystems.
- **Response**:
```json
{
  "status": "ONLINE",
  "service": "CyberEye",
  "version": "1.0.0",
  "timestamp": "2026-09-10T14:45:00Z",
  "demo_mode": true,
  "database": "CONNECTED",
  "subsystems": {
    "3d_globe_telemetry": "ACTIVE",
    "threat_graph_engine": "ACTIVE",
    "passive_collectors": "ONLINE",
    "risk_engine": "ONLINE",
    "defensive_ai_analyst": "ONLINE (Offline Heuristic Fallback Ready)"
  }
}
```

---

## 2. Global Event Feeds

### `GET /api/events`
Retrieve public cybersecurity and geospatial events for 3D globe visualization.
- **Query Parameters**:
  - `event_type` (string, optional): e.g. `Cybersecurity`, `Infrastructure`, `Natural event`.
  - `severity` (string, optional): `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`.
  - `status` (string, optional): `active`, `resolved`.
  - `limit` (integer, default `50`): max number of records.

### `GET /api/events/{id}`
Retrieve complete detail and attack trajectory coordinates for a specific event.

---

## 3. Investigation Endpoints

### `POST /api/investigations`
Initiates passive OSINT collection, risk scoring, and threat graph synthesis.
- **Request Body**:
```json
{
  "target": "acme-defense.org",
  "target_type": "domain",
  "authorized_for_active_checks": true,
  "notes": "Analyst initiated perimeter assessment"
}
```
- **Response**:
```json
{
  "investigation_id": 1,
  "target": "acme-defense.org",
  "target_type": "domain",
  "status": "completed",
  "created_at": "2026-09-10T14:40:00Z",
  "risk_assessment": {
    "score": 76,
    "level": "HIGH",
    "formula_label": "CyberEye Risk Score — heuristic assessment",
    "breakdown": [
      {
        "category": "Asset Exposure",
        "name": "Multiple Public IP Bindings",
        "points": 10,
        "description": "Target resolves to 2 distinct public IPv4 endpoints",
        "severity": "MEDIUM"
      }
    ],
    "summary": "Target displays notable exposure and high-severity vulnerability associations."
  },
  "threat_graph": {
    "nodes": [...],
    "edges": [...]
  }
}
```

### `GET /api/investigations`
List past investigation records and their risk ratings.

### `GET /api/investigations/{id}`
Retrieve details, correlated assets, and relationship count for an investigation.

---

## 4. Threat Graph

### `GET /api/threat-graph/{investigation_id}`
Returns nodes and edges representing relationships between Target, Domain, IP, ASN, Organization, CVEs, and Technologies.

---

## 5. AI Analyst

### `POST /api/ai/analyze`
Chat consultation with the defensive AI analyst.
- **Request Body**:
```json
{
  "query": "What does this finding mean?",
  "target": "acme-defense.org",
  "context": {}
}
```
- **Safety Policy**: Requests attempting exploit generation or unauthorized intrusion are strictly denied.

### `POST /api/ai/summary`
Generates a structured executive intelligence summary distinguishing observed facts, inferences, and limitations.
- **Request Body**:
```json
{
  "investigation_id": 1
}
```

---

## 6. Reports & Data Sources

### `POST /api/reports`
Generates and persists an executive dossier.

### `GET /api/reports/{id}`
Retrieves report contents by report ID.

### `GET /api/datasources`
Lists operational status of all data feeds (NVD, Cloudflare, USGS, Shodan, VirusTotal).
