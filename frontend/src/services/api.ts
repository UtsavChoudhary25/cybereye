import { 
  GlobalEvent, Asset, Vulnerability, ThreatGraph, 
  RiskAssessment, AIResponse, AISummary, Investigation, 
  Report, DataSource, WebScanResult, WebScanPreset,
  User, AuthResponse, UserSession, AuditLog, PrivacyPolicyDisclosure
} from '../types';

const API_BASE = (import.meta.env.VITE_API_URL as string) || '/api';

export const TOKEN_STORAGE_KEY = 'cybereye_auth_token';

function getAuthHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = `API Error [${res.status}]`;
    try {
      const errJson = await res.json();
      errorDetail = errJson.detail || errJson.message || errorDetail;
    } catch {
      const errorText = await res.text().catch(() => 'Unknown network error');
      if (errorText) errorDetail = errorText;
    }
    throw new Error(errorDetail);
  }
  return res.json();
}

export const api = {
  // Authentication & Sessions
  async register(data: { email: string; password: string; full_name?: string }): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await handleResponse<AuthResponse>(res);
    if (result.access_token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, result.access_token);
    }
    return result;
  },

  async login(data: { email: string; password: string }): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await handleResponse<AuthResponse>(res);
    if (result.access_token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, result.access_token);
    }
    return result;
  },

  async logout(): Promise<void> {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
    } finally {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  },

  async logoutAll(): Promise<void> {
    try {
      await fetch(`${API_BASE}/auth/logout-all`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
    } finally {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  },

  async getMe(): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders()
    });
    return handleResponse<User>(res);
  },

  async changePassword(data: { current_password: string; new_password: string }): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse<{ message: string }>(res);
  },

  async resetPasswordRequest(email: string): Promise<{ message: string; demo_reset_token?: string }> {
    const res = await fetch(`${API_BASE}/auth/reset-password-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return handleResponse<{ message: string; demo_reset_token?: string }>(res);
  },

  async resetPasswordConfirm(data: { token: string; new_password: string }): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/auth/reset-password-confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse<{ message: string }>(res);
  },

  async getMyActivity(): Promise<AuditLog[]> {
    const res = await fetch(`${API_BASE}/auth/me/activity`, {
      headers: getAuthHeaders()
    });
    return handleResponse<AuditLog[]>(res);
  },

  async getMySessions(): Promise<UserSession[]> {
    const res = await fetch(`${API_BASE}/auth/me/sessions`, {
      headers: getAuthHeaders()
    });
    return handleResponse<UserSession[]>(res);
  },

  // Administration & Security Auditing (Admin only)
  async getAuditLogs(params?: { event_type?: string; status?: string; user_id?: number; limit?: number; offset?: number }): Promise<{ total: number; failed_logins_24h: number; items: AuditLog[] }> {
    const q = new URLSearchParams();
    if (params?.event_type) q.append('event_type', params.event_type);
    if (params?.status) q.append('status', params.status);
    if (params?.user_id) q.append('user_id', params.user_id.toString());
    if (params?.limit) q.append('limit', params.limit.toString());
    if (params?.offset) q.append('offset', params.offset.toString());

    const res = await fetch(`${API_BASE}/admin/audit-logs?${q.toString()}`, {
      headers: getAuthHeaders()
    });
    return handleResponse<{ total: number; failed_logins_24h: number; items: AuditLog[] }>(res);
  },

  async getAdminUsers(): Promise<User[]> {
    const res = await fetch(`${API_BASE}/admin/users`, {
      headers: getAuthHeaders()
    });
    return handleResponse<User[]>(res);
  },

  async toggleUserStatus(userId: number, isActive: boolean): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/status?is_active=${isActive}`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    return handleResponse<{ message: string }>(res);
  },

  async revokeUserSessions(userId: number): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/sessions`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse<{ message: string }>(res);
  },

  // Privacy & Location
  async getPrivacyPolicy(): Promise<PrivacyPolicyDisclosure> {
    const res = await fetch(`${API_BASE}/security/privacy-policy`);
    return handleResponse<PrivacyPolicyDisclosure>(res);
  },

  async lookupIp(ip?: string): Promise<any> {
    const q = ip ? `?ip=${encodeURIComponent(ip)}` : '';
    const res = await fetch(`${API_BASE}/security/ip-lookup${q}`);
    return handleResponse<any>(res);
  },

  // System Health
  async getHealth(): Promise<any> {
    const res = await fetch(`${API_BASE}/health`);
    return handleResponse(res);
  },

  // Global Events
  async getEvents(params?: { event_type?: string; severity?: string; status?: string; limit?: number }): Promise<GlobalEvent[]> {
    const q = new URLSearchParams();
    if (params?.event_type) q.append('event_type', params.event_type);
    if (params?.severity) q.append('severity', params.severity);
    if (params?.status) q.append('status', params.status);
    if (params?.limit) q.append('limit', params.limit.toString());
    const res = await fetch(`${API_BASE}/events?${q.toString()}`);
    return handleResponse<GlobalEvent[]>(res);
  },

  async getEvent(id: number): Promise<GlobalEvent> {
    const res = await fetch(`${API_BASE}/events/${id}`);
    return handleResponse<GlobalEvent>(res);
  },

  // Investigations
  async createInvestigation(data: { target: string; target_type?: string; authorized_for_active_checks: boolean; notes?: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/investigations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async getInvestigations(): Promise<Investigation[]> {
    const res = await fetch(`${API_BASE}/investigations`, {
      headers: getAuthHeaders()
    });
    return handleResponse<Investigation[]>(res);
  },

  async getInvestigation(id: number): Promise<Investigation> {
    const res = await fetch(`${API_BASE}/investigations/${id}`, {
      headers: getAuthHeaders()
    });
    return handleResponse<Investigation>(res);
  },

  // Assets
  async getAssets(params?: { organization?: string; country?: string; limit?: number }): Promise<Asset[]> {
    const q = new URLSearchParams();
    if (params?.organization) q.append('organization', params.organization);
    if (params?.country) q.append('country', params.country);
    if (params?.limit) q.append('limit', params.limit.toString());
    const res = await fetch(`${API_BASE}/assets?${q.toString()}`);
    return handleResponse<Asset[]>(res);
  },

  // Vulnerabilities
  async getVulnerabilities(params?: { severity?: string; search?: string; limit?: number }): Promise<Vulnerability[]> {
    const q = new URLSearchParams();
    if (params?.severity) q.append('severity', params.severity);
    if (params?.search) q.append('search', params.search);
    if (params?.limit) q.append('limit', params.limit.toString());
    const res = await fetch(`${API_BASE}/vulnerabilities?${q.toString()}`);
    return handleResponse<Vulnerability[]>(res);
  },

  // Threat Graph
  async getThreatGraph(investigationId: number): Promise<ThreatGraph> {
    const res = await fetch(`${API_BASE}/threat-graph/${investigationId}`, {
      headers: getAuthHeaders()
    });
    return handleResponse<ThreatGraph>(res);
  },

  // Risk Score
  async calculateRiskScore(target: string, collectedData?: any): Promise<RiskAssessment> {
    const res = await fetch(`${API_BASE}/risk-score`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ target, collected_data: collectedData })
    });
    return handleResponse<RiskAssessment>(res);
  },

  // AI Analyst
  async aiAnalyze(query: string, target?: string, context?: any): Promise<AIResponse> {
    const res = await fetch(`${API_BASE}/ai/analyze`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ query, target, context })
    });
    return handleResponse<AIResponse>(res);
  },

  async aiSummary(investigationId: number): Promise<AISummary> {
    const res = await fetch(`${API_BASE}/ai/summary`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ investigation_id: investigationId })
    });
    return handleResponse<AISummary>(res);
  },

  // Reports
  async createReport(investigationId: number, title?: string): Promise<Report> {
    const res = await fetch(`${API_BASE}/reports`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ investigation_id: investigationId, title })
    });
    return handleResponse<Report>(res);
  },

  async getReport(id: number): Promise<Report> {
    const res = await fetch(`${API_BASE}/reports/${id}`, {
      headers: getAuthHeaders()
    });
    return handleResponse<Report>(res);
  },

  // Data Sources
  async getDataSources(): Promise<DataSource[]> {
    const res = await fetch(`${API_BASE}/datasources`);
    return handleResponse<DataSource[]>(res);
  },

  async getLiveProviderStatuses(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/datasources/live-status`);
    return handleResponse<any[]>(res);
  },

  // Live Real Feeds Sync & Trigger
  async syncFeeds(): Promise<{ status: string; message: string }> {
    const res = await fetch(`${API_BASE}/events/sync`, { method: 'POST', headers: getAuthHeaders() });
    return handleResponse<{ status: string; message: string }>(res);
  },

  async simulateIncident(): Promise<GlobalEvent> {
    const res = await fetch(`${API_BASE}/events/simulate`, { method: 'POST', headers: getAuthHeaders() });
    return handleResponse<GlobalEvent>(res);
  },

  // Web Vulnerability Scanner & Remediation
  async scanWebsite(url: string, authorized: boolean = true): Promise<WebScanResult> {
    const res = await fetch(`${API_BASE}/scanner/scan`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ url, authorized })
    });
    return handleResponse<WebScanResult>(res);
  },

  async getScanPresets(): Promise<WebScanPreset[]> {
    const res = await fetch(`${API_BASE}/scanner/presets`);
    return handleResponse<WebScanPreset[]>(res);
  }
};
