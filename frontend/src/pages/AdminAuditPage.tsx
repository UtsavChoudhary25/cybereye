import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, ShieldCheck, Users, Clock, Filter, 
  RefreshCw, AlertTriangle, Globe, Lock, Ban, UserCheck, 
  FileText, Activity
} from 'lucide-react';
import { Header } from '../components/common/Header';
import { Sidebar } from '../components/common/Sidebar';
import { StatCard } from '../components/common/StatCard';
import { api } from '../services/api';
import { AuditLog, User } from '../types';
import { useAuth } from '../context/AuthContext';

export const AdminAuditPage: React.FC = () => {
  const { isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<'audit' | 'users'>('audit');
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [totalLogs, setTotalLogs] = useState<number>(0);
  const [failedLogins24h, setFailedLogins24h] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionMessage, setActionMessage] = useState<string>('');

  // Filters
  const [selectedEventType, setSelectedEventType] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  const fetchAuditData = async () => {
    setIsLoading(true);
    setActionMessage('');
    try {
      const [logsRes, usersRes] = await Promise.all([
        api.getAuditLogs({
          event_type: selectedEventType || undefined,
          status: selectedStatus || undefined,
          limit: 100
        }),
        api.getAdminUsers()
      ]);
      setLogs(logsRes.items);
      setTotalLogs(logsRes.total);
      setFailedLogins24h(logsRes.failed_logins_24h);
      setUsers(usersRes);
    } catch (err: any) {
      console.error('Failed to fetch admin data', err);
      setActionMessage('Failed to load administrative records. Ensure you have administrator rights.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAuditData();
    }
  }, [isAdmin, selectedEventType, selectedStatus]);

  const handleToggleUserStatus = async (userId: number, currentStatus: boolean) => {
    try {
      await api.toggleUserStatus(userId, !currentStatus);
      setActionMessage(`User account status successfully updated.`);
      await fetchAuditData();
    } catch (err: any) {
      setActionMessage(err.message || 'Error updating user status.');
    }
  };

  const handleRevokeSessions = async (userId: number) => {
    try {
      await api.revokeUserSessions(userId);
      setActionMessage(`Active sessions for target user have been forcefully revoked.`);
      await fetchAuditData();
    } catch (err: any) {
      setActionMessage(err.message || 'Error revoking user sessions.');
    }
  };

  if (!isAdmin) {
    return (
      <div className="h-screen w-screen flex flex-col bg-[#0a0c12] text-slate-100 font-sans">
        <Header />
        <div className="flex-1 flex overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-md p-8 rounded bg-[#10131d] border border-red-900/60 text-center space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-950/60 text-red-400 border border-red-800">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-base font-mono font-bold text-red-400">ACCESS RESTRICTED</h2>
              <p className="text-xs text-slate-300">
                The Security Audit & Administration command deck requires an Administrator role.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0a0c12] text-slate-100 overflow-hidden font-sans select-none">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0c12]">
          {/* Top Quick Stats Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#0c0e17] border-b border-slate-800/80">
            <StatCard
              label="Total Security Logs"
              value={totalLogs}
              subValue="90-day retention"
              icon={Activity}
              color="blue"
            />
            <StatCard
              label="Failed Logins (24h)"
              value={failedLogins24h}
              subValue="Brute-force watch"
              icon={ShieldAlert}
              color={failedLogins24h > 0 ? "rose" : "emerald"}
            />
            <StatCard
              label="Active Accounts"
              value={users.filter(u => u.is_active).length}
              subValue={`Total: ${users.length}`}
              icon={Users}
              color="purple"
            />
            <StatCard
              label="Audit Posture"
              value="ACTIVE"
              subValue="Zero Credential Leak"
              icon={ShieldCheck}
              color="emerald"
            />
          </div>

          {/* Sub Navigation Bar */}
          <div className="px-6 py-2.5 border-b border-slate-800 flex items-center justify-between bg-[#0e111a]">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab('audit')}
                className={`px-3 py-1.5 rounded text-xs font-mono transition-colors ${
                  activeTab === 'audit'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                Security Audit Log
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-3 py-1.5 rounded text-xs font-mono transition-colors ${
                  activeTab === 'users'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                User Account Management
              </button>
            </div>

            <button
              onClick={fetchAuditData}
              disabled={isLoading}
              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-mono text-[11px] flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Telemetry</span>
            </button>
          </div>

          {actionMessage && (
            <div className="mx-6 mt-3 p-2.5 rounded bg-blue-950/40 border border-blue-900/60 text-blue-300 text-xs font-mono flex items-center justify-between">
              <span>{actionMessage}</span>
              <button onClick={() => setActionMessage('')} className="text-slate-400 hover:text-white">✕</button>
            </div>
          )}

          {/* Tab 1: Security Audit Log */}
          {activeTab === 'audit' && (
            <div className="flex-1 flex flex-col p-6 overflow-hidden space-y-4">
              {/* Filter Strip */}
              <div className="p-3 rounded bg-[#10131e] border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-400">Filter Event:</span>
                  <select
                    value={selectedEventType}
                    onChange={(e) => setSelectedEventType(e.target.value)}
                    className="bg-[#0b0d14] border border-slate-800 rounded px-2.5 py-1 text-slate-200 text-xs"
                  >
                    <option value="">All Event Types</option>
                    <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
                    <option value="LOGIN_FAILURE">LOGIN_FAILURE</option>
                    <option value="LOGIN_RATE_LIMITED">LOGIN_RATE_LIMITED</option>
                    <option value="LOGOUT">LOGOUT</option>
                    <option value="REGISTER">REGISTER</option>
                    <option value="ACCESS_DENIED">ACCESS_DENIED</option>
                    <option value="INVESTIGATION_CREATED">INVESTIGATION_CREATED</option>
                    <option value="REPORT_GENERATED">REPORT_GENERATED</option>
                  </select>

                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="bg-[#0b0d14] border border-slate-800 rounded px-2.5 py-1 text-slate-200 text-xs"
                  >
                    <option value="">All Statuses</option>
                    <option value="SUCCESS">SUCCESS</option>
                    <option value="FAILURE">FAILURE</option>
                  </select>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-slate-500" />
                  <span>IP Geolocation Notice: Location is approximate from BGP Autonomous Systems.</span>
                </div>
              </div>

              {/* Table Container */}
              <div className="flex-1 overflow-y-auto matte-panel rounded border border-slate-800">
                <table className="w-full text-left text-xs font-mono border-collapse">
                  <thead className="bg-[#0e111a] text-slate-400 border-b border-slate-800 sticky top-0 z-10">
                    <tr>
                      <th className="py-2.5 px-3">Timestamp (UTC)</th>
                      <th className="py-2.5 px-3">Event Type</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Subject / Email</th>
                      <th className="py-2.5 px-3">Observed IP</th>
                      <th className="py-2.5 px-3">User Agent Summary</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500 font-mono">
                          No audit entries match the selected filter criteria.
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                            {new Date(log.timestamp).toISOString().replace('T', ' ').slice(0, 19)}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] border ${
                              log.event_type.includes('FAILURE') || log.event_type === 'ACCESS_DENIED'
                                ? 'bg-red-950/60 text-red-300 border-red-800'
                                : log.event_type.includes('LIMITED')
                                ? 'bg-amber-950/60 text-amber-300 border-amber-800'
                                : log.event_type.includes('SUCCESS')
                                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}>
                              {log.event_type}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={log.status === 'SUCCESS' ? 'text-emerald-400' : 'text-red-400'}>
                              {log.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-300">
                            {log.user_email || (log.user_id ? `User #${log.user_id}` : 'Anonymous')}
                          </td>
                          <td className="py-2.5 px-3 text-blue-400 whitespace-nowrap">
                            {log.ip_address}
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 max-w-xs truncate" title={log.user_agent_summary}>
                            {log.user_agent_summary || 'Unknown Client'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 2: User Account Management */}
          {activeTab === 'users' && (
            <div className="flex-1 flex flex-col p-6 overflow-hidden space-y-4">
              <div className="p-3 rounded bg-[#10131e] border border-slate-800 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300 font-semibold">Registered SOC Analysts ({users.length})</span>
                <span className="text-slate-500 text-[11px]">Administrator controls for account activation and session termination</span>
              </div>

              <div className="flex-1 overflow-y-auto matte-panel rounded border border-slate-800">
                <table className="w-full text-left text-xs font-mono border-collapse">
                  <thead className="bg-[#0e111a] text-slate-400 border-b border-slate-800 sticky top-0 z-10">
                    <tr>
                      <th className="py-2.5 px-3">ID</th>
                      <th className="py-2.5 px-3">Email Address</th>
                      <th className="py-2.5 px-3">Full Name</th>
                      <th className="py-2.5 px-3">Role</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-3 text-slate-500">#{u.id}</td>
                        <td className="py-2.5 px-3 text-slate-200 font-semibold">{u.email}</td>
                        <td className="py-2.5 px-3 text-slate-400">{u.full_name || '—'}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] border ${
                            u.role === 'admin'
                              ? 'bg-purple-950/60 text-purple-300 border-purple-800'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}>
                            {u.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`inline-flex items-center gap-1.5 ${
                            u.is_active ? 'text-emerald-400' : 'text-red-400'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-emerald-400' : 'bg-red-400'}`} />
                            {u.is_active ? 'ACTIVE' : 'DISABLED'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 flex items-center gap-2">
                          <button
                            onClick={() => handleToggleUserStatus(u.id, u.is_active)}
                            className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px] transition-colors"
                          >
                            {u.is_active ? 'Disable Account' : 'Enable Account'}
                          </button>
                          <button
                            onClick={() => handleRevokeSessions(u.id)}
                            className="px-2 py-1 rounded bg-red-950/40 hover:bg-red-900/60 border border-red-900/80 text-red-300 text-[11px] transition-colors"
                          >
                            Revoke All Sessions
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
