import React, { useState, useEffect } from 'react';
import { ShieldAlert, Search, ExternalLink, AlertTriangle } from 'lucide-react';
import { Header } from '../components/common/Header';
import { Sidebar } from '../components/common/Sidebar';
import { Badge } from '../components/common/Badge';
import { api } from '../services/api';
import { Vulnerability } from '../types';

export const VulnerabilitiesPage: React.FC = () => {
  const [vulns, setVulns] = useState<Vulnerability[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('');

  useEffect(() => {
    const fetchVulns = async () => {
      try {
        const res = await api.getVulnerabilities({
          severity: selectedSeverity || undefined,
          search: searchTerm || undefined,
          limit: 50,
        });
        setVulns(res);
      } catch (err) {
        console.error('Failed to load vulnerabilities', err);
      }
    };
    fetchVulns();
  }, [selectedSeverity, searchTerm]);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0a0c12] text-slate-100 overflow-hidden font-sans select-none">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-mono font-bold text-slate-100 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                VULNERABILITY & CVE INTELLIGENCE FEED
              </h2>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Heuristically correlated Common Vulnerabilities and Exposures (CVE) sourced from NVD and security advisories.
              </p>
            </div>

            {/* Severity Filter & Search */}
            <div className="flex items-center gap-2">
              <div className="relative w-56">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search CVE or software..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#0d0f17] border border-slate-800 rounded pl-8 pr-3 py-1.5 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-600"
                />
              </div>

              <div className="flex items-center gap-1 bg-[#0d0f17] p-0.5 rounded border border-slate-800 text-xs font-mono">
                {['', 'CRITICAL', 'HIGH', 'MEDIUM'].map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setSelectedSeverity(sev)}
                    className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                      selectedSeverity === sev
                        ? 'bg-slate-800 text-slate-100 font-bold border border-slate-700'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {sev || 'ALL'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Mandatory Defensive Verification Disclaimer */}
          <div className="p-3 rounded bg-amber-950/20 border border-amber-900/40 flex items-center gap-3 text-xs font-sans text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <strong>Defensive Verification Protocol:</strong> Potentially relevant vulnerability — verification required. 
              The mere existence of a public CVE does not confirm active exploitability without internal patch validation.
            </div>
          </div>

          {/* Vulnerabilities Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vulns.map((v) => (
              <div
                key={v.id}
                className="matte-card p-4 rounded border border-slate-800 space-y-2.5 font-mono text-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-100">{v.cve_id}</span>
                      <Badge severity={v.severity} />
                    </div>
                    <h4 className="text-xs font-sans font-bold text-slate-300 leading-snug">
                      {v.title}
                    </h4>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-base font-bold text-red-400">{v.cvss.toFixed(1)}</span>
                    <span className="text-[9px] text-slate-500 block">CVSS v3.1</span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 font-sans leading-relaxed">
                  {v.description}
                </p>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 truncate max-w-[200px]">
                    Tech: <strong className="text-slate-300">{v.affected_technology}</strong>
                  </span>

                  {v.reference && (
                    <a
                      href={v.reference}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <span>NVD Advisory</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
