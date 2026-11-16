from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

# --- Event Schemas ---
class EventBase(BaseModel):
    type: str
    title: str
    description: str
    latitude: float
    longitude: float
    severity: str
    source: str
    source_url: Optional[str] = None
    status: Optional[str] = "active"
    metadata_json: Optional[Dict[str, Any]] = None
    is_demo: Optional[bool] = True

class EventCreate(EventBase):
    pass

class EventResponse(EventBase):
    id: int
    timestamp: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Asset Schemas ---
class AssetBase(BaseModel):
    hostname: Optional[str] = None
    ip: Optional[str] = None
    domain: Optional[str] = None
    organization: Optional[str] = None
    country: Optional[str] = None
    country_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    asn: Optional[str] = None
    technology: Optional[List[str]] = []
    risk_score: Optional[int] = 0

class AssetResponse(AssetBase):
    id: int
    investigation_id: Optional[int] = None
    last_seen: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Vulnerability Schemas ---
class VulnerabilityResponse(BaseModel):
    id: int
    cve_id: str
    title: str
    description: str
    severity: str
    cvss: float
    published_date: Optional[str] = None
    affected_technology: Optional[str] = None
    reference: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

# --- Threat Graph Schemas ---
class GraphNode(BaseModel):
    id: str
    label: str
    type: str  # 'domain', 'ip', 'asn', 'org', 'cve', 'tech', 'event'
    category: Optional[str] = None
    severity: Optional[str] = None
    risk_score: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None

class GraphEdge(BaseModel):
    source: str
    target: str
    relationship: str  # 'resolves_to', 'belongs_to', 'associated_with', 'affected_by', 'located_in'
    confidence: Optional[float] = 1.0

class ThreatGraphResponse(BaseModel):
    investigation_id: Optional[int] = None
    target: str
    nodes: List[GraphNode]
    edges: List[GraphEdge]

# --- Risk Score Schemas ---
class RiskFactor(BaseModel):
    category: str
    name: str
    points: int
    description: str
    severity: str

class RiskScoreResponse(BaseModel):
    target: str
    score: int
    level: str  # 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    formula_label: str = "CyberEye Risk Score — heuristic assessment"
    breakdown: List[RiskFactor]
    summary: str

# --- AI Intelligence Assistant Schemas ---
class AIAnalyzeRequest(BaseModel):
    query: str
    investigation_id: Optional[int] = None
    target: Optional[str] = None
    context: Optional[Dict[str, Any]] = None

class AIAnalyzeResponse(BaseModel):
    response: str
    suggestions: List[str] = []
    source: str = "CyberEye Defensive Intelligence Engine"
    disclaimer: str = "CyberEye operates strictly under defensive security guidelines. No offensive or unauthorized exploitation guidance is provided."

class AISummaryRequest(BaseModel):
    investigation_id: int

class AISummaryResponse(BaseModel):
    executive_summary: str
    target_overview: str
    observed_assets: List[str]
    relevant_vulnerabilities: List[str]
    potential_risks: List[str]
    geographic_context: str
    recommended_defensive_actions: List[str]
    confidence_and_limitations: str

# --- Investigation Schemas ---
class InvestigationCreate(BaseModel):
    target: str
    target_type: str = "domain" # 'domain', 'ip', 'organization'
    authorized_for_active_checks: bool = False
    notes: Optional[str] = None

class InvestigationResponse(BaseModel):
    id: int
    target: str
    target_type: str
    status: str
    risk_score: int
    risk_level: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    assets_count: Optional[int] = 0
    model_config = ConfigDict(from_attributes=True)

# --- Report Schemas ---
class ReportCreate(BaseModel):
    investigation_id: int
    title: Optional[str] = None

class ReportResponse(BaseModel):
    id: int
    investigation_id: int
    target: str
    title: str
    executive_summary: str
    content_json: Dict[str, Any]
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- DataSource Schemas ---
class DataSourceResponse(BaseModel):
    id: int
    name: str
    category: str
    status: str
    is_demo: bool
    last_sync: datetime
    description: Optional[str] = None
    docs_url: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class ProviderStatusResponse(BaseModel):
    name: str
    category: str
    status: str # 'ONLINE', 'CONFIGURED', 'NOT_CONFIGURED', 'OFFLINE', 'DEMO'
    is_configured: bool
    last_update: Optional[str] = None
    items_count: int = 0
    message: Optional[str] = None
    docs_url: Optional[str] = None

# --- Web Vulnerability Scanner & Remediation Schemas ---
class RemediationSnippet(BaseModel):
    framework: str # "nginx", "apache", "express", "nextjs", "django", "caddy"
    title: str
    language: str
    filename: str
    code: str
    instructions: str

class VulnerabilityFinding(BaseModel):
    id: str
    title: str
    category: str # "Headers", "Cookies", "TLS/SSL", "CORS", "Information Disclosure", "DNS Spoofing", "Software CVE"
    severity: str # "CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"
    owasp_category: Optional[str] = None
    cwe_id: Optional[str] = None
    description: str
    impact: str
    evidence: str
    remediation_summary: str
    remediations: Dict[str, RemediationSnippet]
    verification_command: Optional[str] = None

class WebScanRequest(BaseModel):
    url: str
    authorized: bool = True

class WebScanResponse(BaseModel):
    scan_id: str
    target_url: str
    normalized_domain: str
    ip_address: Optional[str] = None
    status_code: Optional[int] = None
    server_banner: Optional[str] = None
    scan_duration_ms: int
    scanned_at: str
    overall_score: int
    overall_grade: str
    summary: str
    findings_count: Dict[str, int]
    findings: List[VulnerabilityFinding]
    passed_checks: List[str]


