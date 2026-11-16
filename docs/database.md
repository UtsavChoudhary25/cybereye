# CYBEREYE Database Schema & Models

CyberEye supports both **SQLite** (out-of-the-box local development fallback at `cybereye.db`) and **PostgreSQL** (production deployment via standard connection strings).

---

## 1. Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    INVESTIGATION ||--o{ ASSET : discovers
    INVESTIGATION ||--o{ RELATIONSHIP : maps
    INVESTIGATION ||--o{ REPORT : generates
    
    INVESTIGATION {
        int id PK
        string target
        string target_type
        string status
        int risk_score
        string risk_level
        text notes
        datetime created_at
        datetime updated_at
    }

    ASSET {
        int id PK
        int investigation_id FK
        string hostname
        string ip
        string domain
        string organization
        string country
        float latitude
        float longitude
        string asn
        json technology
        int risk_score
        datetime last_seen
    }

    RELATIONSHIP {
        int id PK
        int investigation_id FK
        string source_id
        string source_type
        string source_label
        string target_id
        string target_type
        string target_label
        string relation_type
        float confidence
    }

    REPORT {
        int id PK
        int investigation_id FK
        string target
        string title
        text executive_summary
        json content_json
        datetime created_at
    }

    EVENT {
        int id PK
        string type
        string title
        text description
        float latitude
        float longitude
        string severity
        datetime timestamp
        string source
        string source_url
        string status
        json metadata_json
        bool is_demo
    }

    VULNERABILITY {
        int id PK
        string cve_id UK
        string title
        text description
        string severity
        float cvss
        string published_date
        string affected_technology
        string reference
    }

    DATASOURCE {
        int id PK
        string name UK
        string category
        string status
        bool is_demo
        datetime last_sync
        text description
        string docs_url
    }
```

---

## 2. Table Specifications

### `investigations`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | Integer | Primary Key, Auto Increment | Unique investigation ID |
| `target` | String(255) | Indexed, Not Null | Evaluated domain, IP, or organization |
| `target_type` | String(50) | Not Null | `domain`, `ip`, or `organization` |
| `status` | String(50) | Default: `completed` | Pipeline execution state |
| `risk_score` | Integer | Default: 0 | Normalized score (0-100) |
| `risk_level` | String(20) | Default: `LOW` | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| `notes` | Text | Nullable | Context notes or scan summary |
| `created_at` | DateTime | UTC Timestamp | Creation time |

### `events`
| Column | Type | Description |
|---|---|---|
| `id` | Integer PK | Event primary key |
| `type` | String(100) | `Cybersecurity`, `Infrastructure`, `Natural event`, `Vulnerability` |
| `title` | String(255) | Human-readable incident title |
| `description` | Text | Technical narrative |
| `latitude` | Float | Geospatial latitude coordinate (-90 to 90) |
| `longitude` | Float | Geospatial longitude coordinate (-180 to 180) |
| `severity` | String(50) | `CRITICAL`, `HIGH`, `MEDIUM`, `LOW` |
| `source` | String(100) | Telemetry provider (e.g. CISA, BGPmon, USGS) |
| `metadata_json` | JSON | Layer attributes (attack origin, volume, cable names) |
