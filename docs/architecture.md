# CYBEREYE System Architecture

**CYBEREYE** is an AI-powered cyber-intelligence and OSINT visualization platform designed to reduce the time required to collect, understand, correlate, and visualize publicly available cybersecurity intelligence.

---

## 1. High-Level Architectural Flow

```mermaid
graph TD
    Client["User / SOC Analyst Browser (React 19 + TypeScript + Vite)"]
    
    subgraph Frontend["Presentation Layer"]
        Globe["3D CesiumJS Planetary Globe"]
        Graph["Interactive Threat Graph (Force-Directed)"]
        Timeline["Chronological Incident Timeline"]
        AI_UI["Defensive AI Assistant Panel"]
        Dossier["Executive Dossier / PDF Generator"]
    end
    
    subgraph API_Gateway["FastAPI Application Gateway (:8000)"]
        CORS["CORS & Security Middleware"]
        AuthGate["Active Scan Authorization Gate"]
        Router["REST Endpoints (/api/...)"]
    end
    
    subgraph Intelligence_Engine["CyberEye Intelligence Engine"]
        Collectors["Modular Passive Collectors (DNS, ASN, TLS, Tech, Rep, Vuln)"]
        RiskEngine["Transparent Heuristic Risk Engine (0-100)"]
        GraphBuilder["Threat Graph Builder & Correlation"]
        AIService["Defensive AI Analyst (Offline Heuristic + Gemini)"]
    end
    
    subgraph Data_Layer["Storage & Cache"]
        SQLite["SQLite (Local Dev cybereye.db)"]
        Postgres["PostgreSQL (Production Ready)"]
    end

    Client --> Frontend
    Frontend --> API_Gateway
    API_Gateway --> Intelligence_Engine
    Intelligence_Engine --> Data_Layer
```

---

## 2. Intelligence Processing Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Analyst as SOC Analyst
    participant Frontend as CyberEye UI
    participant API as FastAPI Router
    participant Engine as Intelligence Engine
    participant Collectors as Passive OSINT Collectors
    participant AI as Defensive AI Service
    participant DB as Database

    Analyst->>Frontend: Enter Target (Domain / IP / Org) + Consent Checkbox
    Frontend->>API: POST /api/investigations
    API->>Engine: Initiate Investigation
    par Concurrent Passive Collection
        Engine->>Collectors: DNSCollector (A, MX, TXT, SPF, DMARC)
        Engine->>Collectors: ASNCollector (BGP, CIDR, ISP, Country)
        Engine->>Collectors: CertificateCollector (SANs, Issuer, Validity)
        Engine->>Collectors: TechnologyCollector (Headers, Server, HSTS, CSP)
        Engine->>Collectors: ReputationCollector (Blocklist Telemetry)
        Engine->>Collectors: VulnerabilityCollector (CVE Advisories)
    end
    Collectors-->>Engine: Raw Collector Payloads
    Engine->>Engine: Normalize & Correlate Entities
    Engine->>Engine: Compute Heuristic Risk Score (Exposure + Vuln + Config + Intel)
    Engine->>Engine: Build Force-Directed Threat Graph Topology
    Engine->>DB: Persist Investigation, Asset & Relationships
    Engine-->>API: Complete Investigation Bundle
    API-->>Frontend: JSON Response
    Frontend->>Analyst: Render 3D Globe Pin, Risk Score Card & Threat Graph
    opt AI Explanation
        Analyst->>Frontend: "Explain this finding / Generate Summary"
        Frontend->>API: POST /api/ai/summary
        API->>AI: Synthesize Defensive Assessment
        AI-->>Frontend: Structured Executive Briefing
    end
```

---

## 3. Subsystem Breakdown

### 3.1 3D Planetary Globe (CesiumJS)
- **Engine**: CesiumJS WGS84 ellipsoid renderer.
- **Layers**: Multi-layer toggling for Cyber Events, Infrastructure (Submarine Cables, Data Centers), Earthquakes (USGS API), Weather Events, Maritime Transport, and Threat Advisories.
- **Dynamic Telemetry**: Point markers color-coded by severity (Critical, High, Medium, Low) and animated geodesic attack trajectory arcs.
- **Resilience**: Safe 2D canvas fallback if WebGL acceleration is constrained.

### 3.2 Threat Graph (Force-Directed Node-Link)
- **Nodes**: `Domain`, `IP`, `ASN`, `Organization`, `CVE`, `Technology`, `Event`.
- **Edges**: `resolves_to`, `belongs_to`, `associated_with`, `affected_by`, `located_in`, `runs_service`.
- **Simulation**: Real-time repulsion physics, spring tension, drag-and-drop, zoom/pan, and node inspector flyouts.

### 3.3 Transparent Risk Scoring Engine
$$\text{Risk Score} = \text{Asset Exposure} + \text{Vuln Severity} + \text{Security Config} + \text{Intelligence Indicators}$$
- **0–29 LOW**: Minimal public exposure, robust security headers.
- **30–59 MEDIUM**: Standard perimeter footprint, minor advisory matches.
- **60–79 HIGH**: Exposed server banners, unpatched high-severity CVEs, missing HSTS.
- **80–100 CRITICAL**: Acute vulnerability exposure or active malicious reputation flags.
- **Auditability**: Every score returns an explicit points breakdown table explaining *why* the score was assigned.

### 3.4 Defensive AI Analyst
- Enforces strict defensive cybersecurity safety bounds.
- Rejects requests seeking exploit payloads, credential theft, or unauthorized access instructions.
- Provides actionable remediation guidance, CVE plain-English summaries, and investigation summaries.
- Functions 100% offline via built-in heuristic analysis when no API key is set.
