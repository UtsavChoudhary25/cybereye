import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Eye, Lock, ArrowLeft, Globe, FileText, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { PrivacyPolicyDisclosure } from '../types';

export const PrivacyPolicyPage: React.FC = () => {
  const [policy, setPolicy] = useState<PrivacyPolicyDisclosure | null>(null);

  useEffect(() => {
    api.getPrivacyPolicy().then(setPolicy).catch(console.error);
  }, []);

  return (
    <div className="min-h-screen w-screen flex flex-col justify-between bg-[#0a0c12] text-slate-100 font-sans select-none">
      <header className="h-14 border-b border-slate-800/80 px-6 flex items-center justify-between bg-[#0d0f17]">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded bg-slate-900 border border-slate-700 text-slate-200">
            <Eye className="w-4 h-4 text-blue-400" />
          </div>
          <span className="font-mono font-bold tracking-widest text-sm text-slate-100">
            CYBER<span className="text-blue-400">EYE</span>
          </span>
        </Link>
        <Link 
          to="/dashboard"
          className="text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Command Console</span>
        </Link>
      </header>

      <main className="flex-1 flex justify-center p-6 md:p-10">
        <div className="w-full max-w-3xl space-y-8">
          <div className="space-y-3 pb-6 border-b border-slate-800">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-blue-950/60 border border-blue-800 text-blue-400 text-xs font-mono">
              <Shield className="w-3.5 h-3.5" />
              <span>DEFENSIVE COMPLIANCE & PRIVACY CHARTER</span>
            </div>
            <h1 className="text-2xl font-mono font-bold text-slate-100">
              Security Telemetry & Privacy Notice
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              CyberEye is built on strict defensive principles. We collect only what is necessary to safeguard system integrity, authenticate analysts, and correlate public OSINT intelligence.
            </p>
          </div>

          {/* Privacy Commitments Callout */}
          <div className="p-5 rounded bg-[#10131e] border border-slate-800 space-y-4">
            <h2 className="text-sm font-mono font-bold text-blue-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              OUR CORE PRIVACY COMMITMENTS
            </h2>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">•</span>
                <span><strong>No GPS or Browser Location Tracking:</strong> CyberEye never requests or captures HTML5 Geolocation coordinates or device GPS sensor data.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">•</span>
                <span><strong>Approximate Geolocation Notice:</strong> All displayed geographic coordinates (e.g., globe arcs and IP telemetry) represent network-level approximations derived from public Autonomous System (BGP) routing tables. They do not pinpoint individuals, physical devices, or residential addresses.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">•</span>
                <span><strong>Zero Credential Logging:</strong> Passwords, JWT session tokens, and API credentials are never recorded in application logs, database audit trails, or network traces.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">•</span>
                <span><strong>Strict Least-Privilege Scoping:</strong> Ordinary analysts can only access their own investigations and reports. Cross-user data access (IDOR) is strictly rejected at the API layer.</span>
              </li>
            </ul>
          </div>

          {/* Data Collected Table */}
          <div className="space-y-4">
            <h2 className="text-sm font-mono font-bold text-slate-200 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              SECURITY DATA CATEGORIES & RETENTION
            </h2>

            <div className="divide-y divide-slate-800 rounded border border-slate-800 bg-[#0d1017]">
              {policy?.data_collected.map((cat, idx) => (
                <div key={idx} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-100">{cat.category}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      Retention: {cat.retention}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    <strong>Fields:</strong> {cat.fields.join(', ')}
                  </p>
                  <p className="text-xs text-slate-400">
                    <strong>Purpose:</strong> {cat.purpose}
                  </p>
                  <p className="text-[11px] font-mono text-slate-500">
                    <strong>Authorized Access:</strong> {cat.access}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="p-4 border-t border-slate-800/80 text-center text-[11px] font-mono text-slate-500">
        CyberEye Defense Command • Transparent Defensive Security Architecture
      </footer>
    </div>
  );
};
