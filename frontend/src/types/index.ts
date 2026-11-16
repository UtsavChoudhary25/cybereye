export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface GlobalEvent {
  id: number;
  type: string;
  title: string;
  description: string;
  latitude: float;
  longitude: float;
  severity: Severity;
  timestamp: string;
  source: string;
  source_url?: string;
  status: 'active' | 'resolved' | 'investigating';
  metadata_json?: Record<string, any>;
  is_demo?: boolean;
}

export interface Asset {
  id: number;
  hostname?: string;
  ip?: string;
  domain?: string;
  organization?: string;
  country?: string;
  country_code?: string;
  latitude?: number;
  longitude?: number;
  asn?: string;
  technology?: string[];
  risk_score?: number;
  last_seen: string;
}

export interface Vulnerability {
  id: number;
  cve_id: string;
  title: string;
  description: string;
  severity: Severity;
  cvss: number;
  published_date?: string;
  affected_technology?: string;
  reference?: string;
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'domain' | 'ip' | 'asn' | 'org' | 'cve' | 'tech' | 'event';
  category?: string;
  severity?: string;
  risk_score?: number;
  metadata?: Record<string, any>;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  relationship: string;
  confidence?: number;
}

export interface ThreatGraph {
  investigation_id?: number;
  target: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface RiskFactor {
  category: string;
  name: string;
  points: number;
  description: string;
  severity: string;
}

export interface RiskAssessment {
  target: string;
  score: number;
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  formula_label: string;
  breakdown: RiskFactor[];
  summary: string;
}

export interface AIResponse {
  response: string;
  suggestions: string[];
  source: string;
  disclaimer: string;
}

export interface AISummary {
  executive_summary: string;
  target_overview: string;
  observed_assets: string[];
  relevant_vulnerabilities: string[];
  potential_risks: string[];
  geographic_context: string;
  recommended_defensive_actions: string[];
  confidence_and_limitations: string;
}

export interface Investigation {
  id: number;
  target: string;
  target_type: string;
  status: string;
  risk_score: number;
  risk_level: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  assets_count?: number;
  risk_assessment?: RiskAssessment;
  threat_graph?: ThreatGraph;
  intelligence?: Record<string, any>;
}

export interface Report {
  id: number;
  investigation_id: number;
  target: string;
  title: string;
  executive_summary: string;
  content_json: Record<string, any>;
  created_at: string;
}

export interface DataSource {
  id: number;
  name: string;
  category: string;
  status: 'ONLINE' | 'DEGRADED' | 'DEMO_MODE' | 'NOT_CONFIGURED';
  is_demo: boolean;
  last_sync: string;
  description?: string;
  docs_url?: string;
}

// --- Web Vulnerability Scanner & Remediation ---
export interface RemediationSnippet {
  framework: string; // 'nginx' | 'apache' | 'express' | 'nextjs' | 'django' | 'dns';
  title: string;
  language: string;
  filename: string;
  code: string;
  instructions: string;
}

export interface VulnerabilityFinding {
  id: string;
  title: string;
  category: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  owasp_category?: string;
  cwe_id?: string;
  description: string;
  impact: string;
  evidence: string;
  remediation_summary: string;
  remediations: Record<string, RemediationSnippet>;
  verification_command?: string;
}

export interface WebScanResult {
  scan_id: string;
  target_url: string;
  normalized_domain: string;
  ip_address?: string;
  status_code?: number;
  server_banner?: string;
  scan_duration_ms: number;
  scanned_at: string;
  overall_score: number; // 0 to 100
  overall_grade: string; // 'A+' | 'A' | 'B' | 'C' | 'D' | 'F'
  summary: string;
  findings_count: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    passed: number;
  };
  findings: VulnerabilityFinding[];
  passed_checks: string[];
}

export interface WebScanPreset {
  title: string;
  url: string;
  category: string;
  description: string;
}

export type float = number;

export interface User {
  id: number;
  email: string;
  full_name?: string;
  role: 'user' | 'admin';
  is_active: boolean;
  is_verified: boolean;
  created_at?: string;
  last_login_at?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_at: string;
  user: User;
}

export interface UserSession {
  id: number;
  token_jti: string;
  ip_address?: string;
  user_agent_summary?: string;
  created_at: string;
  expires_at: string;
  is_revoked: boolean;
}

export interface AuditLog {
  id: number;
  timestamp: string;
  event_type: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  user_id?: number;
  user_email?: string;
  ip_address?: string;
  user_agent_summary?: string;
  action_details?: Record<string, any>;
  status: 'SUCCESS' | 'FAILURE';
}

export interface PrivacyPolicyDisclosure {
  title: string;
  version: string;
  last_updated: string;
  data_collected: Array<{
    category: string;
    fields: string[];
    purpose: string;
    retention: string;
    access: string;
  }>;
  privacy_commitments: string[];
}

