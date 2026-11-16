# CYBEREYE — AI-Powered Cyber Intelligence & OSINT Platform

> **"See the signal. Understand the threat."**

CyberEye is a production-quality, MCA-level cyber intelligence and OSINT visualization command center. It collects publicly available cybersecurity and geospatial intelligence, correlates related entities (Domains, IPs, ASNs, CVEs, Geolocation), visualizes global telemetry on an interactive 3D CesiumJS globe, maps relationships in a force-directed Threat Graph, calculates transparent heuristic risk scores, provides defensive AI analyst assistance, and exports executive investigation dossiers.

---

## 1. Problem Statement

Modern cybersecurity analysts and defenders are overwhelmed by disparate intelligence silos. Gathering intelligence on a target requires manually querying DNS records, WHOIS/RDAP registries, BGP routing tables, TLS certificates, web technology banners, and public vulnerability databases (NVD). This fragmented workflow delays critical threat comprehension and defensive prioritization.

## 2. The Solution

CyberEye unifies passive reconnaissance and threat correlation into a single cohesive interface:
$$\text{Collect} \longrightarrow \text{Correlate} \longrightarrow \text{Visualize} \longrightarrow \text{Analyze}$$

- **Interactive 3D Planetary Telemetry**: High-density CesiumJS globe showing volumetric DDoS attacks, ransomware campaigns, fiber cable breaks, and seismic anomalies.
- **Force-Directed Threat Graph**: Real-time relationship visualizer mapping connections between targets, IP infrastructure, Autonomous Systems, organizations, and CVE advisories.
- **Transparent Risk Scoring Engine**: Heuristic formula (0–100) providing an auditable, points-based breakdown of risk factors.
- **Defensive AI Analyst**: Conversational assistant adhering to strict educational and defensive boundaries, delivering plain-English CVE explanations and actionable hardening guidance.
- **Zero-Configuration Demo Mode**: Operates 100% offline out-of-the-box using realistic synthetic cyber intelligence fixtures.

---

## 3. Tech Stack

| Layer | Technology |
|---|---|
| **Frontend UI** | React 19, TypeScript, Vite 6, Tailwind CSS v4, Lucide React, Recharts |
| **3D Visualization** | CesiumJS (WGS84 Ellipsoid, Geodesic Arcs, Multi-Layer Manager) |
| **Backend API** | Python 3.13, FastAPI, Pydantic v2, Uvicorn, HTTPX |
| **Database** | SQLAlchemy ORM with SQLite local fallback (`cybereye.db`) & PostgreSQL ready |
| **AI Intelligence** | Dual Engine: Heuristic Rule-Based Defensive Analyst (Offline) + Google Gemini API (Live) |
| **Reporting** | ReportLab & HTML5 Printable Executive Dossier Generator |

---

## 4. System Architecture

```mermaid
graph TD
    Client["Analyst Console (React 19 + TypeScript + Tailwind)"]
    
    subgraph Frontend["SOC Viewport"]
        Globe["3D CesiumJS Planetary Globe"]
        Graph["Interactive Threat Graph (Force Simulation)"]
        Timeline["Chronological Incident Timeline"]
        AI_UI["Defensive AI Assistant Panel"]
        Dossier["Executive Dossier Generator"]
    end
    
    subgraph Backend["FastAPI REST Services (:8000)"]
        Collectors["Modular Passive Collectors (DNS, ASN, TLS, Tech, Rep, Vuln)"]
        RiskEngine["Transparent Heuristic Risk Engine (0-100)"]
        GraphBuilder["Threat Graph Builder & Correlation"]
        AIService["Defensive AI Analyst (Offline + Gemini)"]
    end
    
    subgraph Data["Database Layer"]
        DB[(SQLite / PostgreSQL)]
    end

    Client --> Frontend
    Frontend --> Backend
    Backend --> Data
```

---

## 5. Getting Started & Installation

### Prerequisites
- **Node.js**: v18+ (tested with v24)
- **Python**: v3.10+ (tested with v3.13)

### 1. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\Activate.ps1
# Linux/macOS:
source venv/bin/activate

### 1. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\Activate.ps1
# Linux/macOS:
source venv/bin/activate

# Install dependencies (includes argon2-cffi, pyjwt, email-validator)
pip install -r requirements.txt

# Run FastAPI dev server
uvicorn app.main:app --reload --port 8000
```
Backend will be available at: `http://127.0.0.1:8000` (API Docs at `/docs`).

### 2. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Run Vite dev server
npm run dev

# Or compile production bundle
npm run build
```
Frontend will be available at: `http://localhost:5173`.

### 3. Initial Administrator Setup
By design, public registration strictly creates standard `user` accounts with least-privilege permissions. To provision an administrator, run the secure backend CLI utility:
```bash
cd backend
# Windows:
.\venv\Scripts\python.exe -m app.core.create_admin --email admin@cybereye.internal --password "YourSuperSecurePassword123!" --name "SOC Lead Admin"

# Linux/macOS:
python -m app.core.create_admin --email admin@cybereye.internal --password "YourSuperSecurePassword123!" --name "SOC Lead Admin"
```

---

## 6. Security & Authentication Architecture

### 1. Password Hashing (Argon2id)
- Passwords are never stored in plaintext and never logged.
- Hashed using **Argon2id** (winner of the Password Hashing Competition, RFC 9106) with parameters:
  - Memory Cost: 65,536 KiB (64 MiB)
  - Time Cost: 3 iterations
  - Parallelism: 4 threads
  - Salt: Cryptographically random 16-byte salt generated per password

### 2. Session Management & Revocation
- Stateless signed JWTs embedded with a unique Session ID (`jti`).
- Each login registers an active session record in the database.
- Logging out or selecting "Revoke All Other Sessions" immediately marks the session as revoked in the database, invalidating the JWT across all devices.

### 3. Brute-Force & Credential Stuffing Defense
- In-memory sliding-window `LoginRateLimiter`:
  - Limit: 5 failed attempts per 300 seconds (5 minutes) per email or IP address.
  - Returns `429 Too Many Requests` with a compliant `Retry-After: <seconds>` HTTP header.
- Anti-enumeration: Authentication endpoints return generic `Invalid email or password` errors to prevent account enumeration.

### 4. Role-Based Access Control (RBAC) & IDOR Defense
- Role hierarchy: `user` (own records only) and `admin` (system-wide audit log and user oversight).
- Investigations and Reports enforce `owner_id` scoping at the database query level:
  - Non-owners cannot read, update, or delete other users' investigations (`403 Forbidden`).
  - Administrators retain oversight capabilities.

### 5. Security Audit Logging & Privacy Disclosure
- Audit logs capture:
  - Event Type (`LOGIN_SUCCESS`, `LOGIN_FAILED`, `LOGOUT`, `PASSWORD_RESET`, `REGISTER`, `ACCESS_DENIED`, etc.)
  - UTC Timestamp (`datetime.datetime.now(datetime.UTC)`)
  - Resolved Client IP (evaluating trusted proxy headers like `CF-Connecting-IP` / `X-Forwarded-For` against `TRUSTED_PROXIES`)
  - User-Agent Summary (sanitized)
  - Execution Status (`SUCCESS` / `FAILURE`)
- **Privacy Notice**: IP addresses are only processed for defensive security auditing. Geolocation estimates are strictly coarse network-level estimates derived from public BGP Autonomous System registries. **Zero GPS or device sensors are ever accessed.**

---

## 7. Database Persistence & Migrations

- **Development**: Local SQLite (`cybereye.db`) with automatic table creation and automatic column migration (`ensure_schema_migrations()`).
- **Production**: PostgreSQL compatible (`postgresql://user:pass@host:5432/cybereye`).
- Schema persists:
  - Users, user sessions, and password reset tokens.
  - Investigations, threat graph nodes/edges, and reports linked to `owner_id`.
  - Immutable security audit logs.
- Automatic migration executes on FastAPI startup to dynamically detect and add any missing columns (such as `owner_id`) to existing tables without data loss.

---

## 8. Free Deployment Guide

### A. Frontend Deployment (Cloudflare Pages — 100% Free)
1. Commit the repository to your private GitHub or GitLab account.
2. In the [Cloudflare Dashboard](https://dash.cloudflare.com/):
   - Go to **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**.
   - Select the `cybereye` repository.
   - Build settings:
     - **Framework preset**: `Vite`
     - **Root directory**: `frontend`
     - **Build command**: `npm run build`
     - **Build output directory**: `dist`
   - Environment variables:
     - `VITE_API_URL`: `https://your-backend-service.onrender.com/api` (URL of your live backend API).
3. The included `frontend/public/_redirects` file automatically copies to `dist/_redirects` (`/* /index.html 200`), ensuring all React Router client paths (`/login`, `/dashboard`, `/admin`) resolve without 404 errors.

### B. Backend Deployment (Render, Railway, or Koyeb — Free Tier)
1. Create a free PostgreSQL database on [Neon.tech](https://neon.tech) or [Supabase](https://supabase.com).
2. Create a new Web Service on [Render](https://render.com) or [Railway](https://railway.app):
   - **Root directory**: `backend`
   - **Build command**: `pip install -r requirements.txt`
   - **Start command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Environment variables**:
     - `SECRET_KEY`: `<Generate a random 64-char string: python -c "import secrets; print(secrets.token_hex(32))">`
     - `DATABASE_URL`: `<Your Neon/Supabase PostgreSQL connection string>`
     - `CORS_ORIGINS`: `["https://your-app.pages.dev"]`
     - `TRUSTED_PROXIES`: `["10.0.0.0/8","172.16.0.0/12","192.168.0.0/16","127.0.0.1"]`
     - `DEMO_MODE`: `True`

---

## 9. Viva & Technical Demonstration Guide

### Key Demo Targets
1. `acme-defense.org`: Demonstrates a high-risk defense perimeter profile with exposed nginx banners, critical CVE-2024-24919 correlation, missing HSTS, and multi-node threat graph topology.
2. `fintech-global.io`: Demonstrates an enterprise financial infrastructure profile behind Cloudflare CDN with hardened security headers (Grade A+).
3. `8.8.8.8`: Demonstrates public recursive DNS Anycast routing telemetry.

---

## 10. License & Ethical Disclaimer

This project is created for **educational and defensive cybersecurity research only**. Do not use against targets without explicit authorization.

