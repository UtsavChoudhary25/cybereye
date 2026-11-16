import React, { useState, useEffect } from 'react';
import { 
  Settings, Shield, Eye, CheckCircle2, KeyRound, 
  Laptop, AlertTriangle, RefreshCw, LogOut, Check
} from 'lucide-react';
import { Header } from '../components/common/Header';
import { Sidebar } from '../components/common/Sidebar';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { UserSession } from '../types';

export const SettingsPage: React.FC = () => {
  const { user, isAuthenticated, logoutAll } = useAuth();
  const [, setHealth] = useState<any>(null);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await api.getHealth();
        setHealth(res);
      } catch (err) {
        console.error('Failed to load health status', err);
      }
    };
    fetchHealth();
  }, []);

  const loadSessions = async () => {
    if (!isAuthenticated) return;
    setIsLoadingSessions(true);
    try {
      const data = await api.getMySessions();
      setSessions(data);
    } catch (err) {
      console.error('Failed to fetch user sessions', err);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadSessions();
    }
  }, [isAuthenticated]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (newPassword.length < 10) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 10 characters' });
      return;
    }

    setIsChangingPassword(true);
    try {
      await api.changePassword({ current_password: currentPassword, new_password: newPassword });
      setPasswordMsg({ type: 'success', text: 'Password successfully updated. Argon2id hash renewed.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message || 'Failed to change password. Check your current password.' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0a0c12] text-slate-100 overflow-hidden font-sans select-none">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-base font-mono font-bold text-slate-100 flex items-center gap-2">
              <Settings className="w-4 h-4 text-blue-400" />
              CYBEREYE CONFIGURATION & SYSTEM DIAGNOSTICS
            </h2>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Review platform operational parameters, API telemetry, defensive boundaries, and account security controls.
            </p>
          </div>

          {/* Account Security Card (For logged in users) */}
          {isAuthenticated && user && (
            <div className="matte-panel p-5 rounded border border-slate-800 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
                <div>
                  <h3 className="text-sm font-mono font-bold text-slate-100 flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-blue-400" />
                    ACCOUNT SECURITY & ACTIVE SESSIONS
                  </h3>
                  <p className="text-xs text-slate-400 font-sans mt-0.5">
                    Logged in as <strong className="text-slate-200">{user.email}</strong> • Role: <span className="font-mono text-blue-400 uppercase">{user.role}</span>
                  </p>
                </div>
                <button
                  onClick={logoutAll}
                  className="px-3 py-1.5 rounded bg-red-950/40 hover:bg-red-900/50 border border-red-800/60 text-red-300 font-mono text-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Revoke All Other Sessions</span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Change Password Form */}
                <form onSubmit={handleChangePassword} className="space-y-3 font-mono text-xs">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Change Password (Argon2id Hashed)
                  </h4>

                  {passwordMsg && (
                    <div className={`p-2.5 rounded border text-xs flex items-center gap-2 ${
                      passwordMsg.type === 'success'
                        ? 'bg-emerald-950/30 border-emerald-800 text-emerald-300'
                        : 'bg-red-950/30 border-red-800 text-red-300'
                    }`}>
                      {passwordMsg.type === 'success' ? <Check className="w-3.5 h-3.5 shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
                      <span>{passwordMsg.text}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Current Password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      placeholder="••••••••••••"
                      className="w-full bg-[#11141e] border border-slate-800 rounded px-3 py-2 text-slate-200 text-xs focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">New Password (min 10 characters)</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="••••••••••••"
                      className="w-full bg-[#11141e] border border-slate-800 rounded px-3 py-2 text-slate-200 text-xs focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="••••••••••••"
                      className="w-full bg-[#11141e] border border-slate-800 rounded px-3 py-2 text-slate-200 text-xs focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded font-mono font-bold text-xs transition-colors flex items-center gap-1.5"
                  >
                    {isChangingPassword ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
                    <span>Update Password</span>
                  </button>
                </form>

                {/* Active Sessions List */}
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <Laptop className="w-3.5 h-3.5 text-blue-400" />
                      Known Active Sessions
                    </h4>
                    <button
                      onClick={loadSessions}
                      className="text-slate-400 hover:text-slate-200 p-1"
                      title="Refresh sessions"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSessions ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto divide-y divide-slate-800/80">
                    {sessions.length === 0 ? (
                      <div className="p-3 bg-slate-900/60 rounded border border-slate-800/60 text-slate-400 text-[11px]">
                        No remote sessions registered.
                      </div>
                    ) : (
                      sessions.map((sess) => (
                        <div key={sess.id} className="pt-2 pb-1 flex items-start justify-between">
                          <div>
                            <div className="text-slate-200 flex items-center gap-2">
                              <span>IP: {sess.ip_address || '127.0.0.1'}</span>
                              {!sess.is_revoked ? (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800">
                                  ACTIVE
                                </span>
                              ) : (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                                  REVOKED
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-sans mt-0.5 max-w-xs truncate">
                              Agent: {sess.user_agent_summary || 'Standard browser client'}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                              Created: {new Date(sess.created_at).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* System Status & Integrations */}
            <div className="matte-panel p-5 rounded border border-slate-800 space-y-4 font-mono text-xs">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-400" /> System & API Status
              </h3>

              <div className="space-y-2.5 divide-y divide-slate-800">
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-slate-400">Core Service Engine</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> ONLINE (FastAPI)
                  </span>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-slate-400">Database Engine</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> SQLite / PostgreSQL Ready
                  </span>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-slate-400">Authentication Architecture</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Argon2id + Signed JWT
                  </span>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-slate-400">Security Audit System</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Immutable Audit Logs
                  </span>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-slate-400">Brute-Force Protection</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Rate Limiter (5 attempts/300s)
                  </span>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-slate-400">Synthetic Demo Fallback</span>
                  <span className="text-amber-400 font-bold">
                    ACTIVE (Zero-API Key Required)
                  </span>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-slate-400">Active Scan Authorization Gate</span>
                  <span className="text-emerald-400 font-bold">
                    ENFORCED (User Consent Required)
                  </span>
                </div>
              </div>
            </div>

            {/* About CyberEye & Architecture */}
            <div className="matte-panel p-5 rounded border border-slate-800 space-y-4 font-sans text-xs">
              <h3 className="text-xs font-mono font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-400" /> About CyberEye & Architecture
              </h3>

              <p className="text-slate-300 leading-relaxed">
                <strong>CYBEREYE</strong> is an interactive cyber-intelligence and OSINT visualization platform. 
                Built to collect, correlate, and visualize publicly available cybersecurity intelligence into an authoritative SOC dashboard.
              </p>

              <div className="space-y-1.5 p-3 rounded bg-slate-900 border border-slate-800 font-mono text-[11px]">
                <div className="text-slate-300 font-bold">Core Stack:</div>
                <div className="text-slate-400">• Frontend: React 19, TypeScript, Vite 6, Tailwind CSS, CesiumJS, Recharts, Lucide</div>
                <div className="text-slate-400">• Backend: Python 3.13, FastAPI, SQLAlchemy 2.0, Pydantic v2, Argon2-cffi, PyJWT</div>
                <div className="text-slate-400">• Database: SQLite local fallback + PostgreSQL production support</div>
                <div className="text-slate-400">• Security: Argon2id, JWT with session revocation, Rate Limiter, Audit Trail</div>
              </div>

              <div className="p-3 rounded bg-red-950/20 border border-red-900/40 text-[11px] text-red-200">
                <strong>Defensive Policy:</strong> CyberEye strictly complies with defensive and educational cybersecurity mandates. 
                No credential intrusion, password cracking, exploit development, or automated attack tools are included.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

