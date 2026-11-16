import React, { useState } from 'react';
import { Binary, Search, Terminal, RefreshCw } from 'lucide-react';
import { Header } from '../components/common/Header';
import { Sidebar } from '../components/common/Sidebar';

export const IntelligencePage: React.FC = () => {
  const [target, setTarget] = useState('acme-defense.org');
  const [mode, setMode] = useState<'domain' | 'ip'>('domain');
  const [intelResult, setIntelResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFetchIntel = async () => {
    if (!target.trim() || isLoading) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/intelligence/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: target.trim(), authorized_for_active_checks: true }),
      });
      const data = await res.json();
      setIntelResult(data);
    } catch (err) {
      console.error('Failed to fetch intel', err);
    } finally {
      setIsLoading(false);
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
              <Binary className="w-4 h-4 text-blue-400" />
              PASSIVE OSINT TELEMETRY CONSOLE
            </h2>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Query individual passive collectors to inspect raw DNS records, BGP Autonomous System prefixes, TLS handshakes, and reputation flags.
            </p>
          </div>

          {/* Query Bar */}
          <div className="matte-panel p-4 rounded border border-slate-800 flex flex-col sm:flex-row items-center gap-2.5">
            <div className="flex rounded bg-[#0d0f17] p-0.5 border border-slate-800 text-xs font-mono">
              <button
                onClick={() => setMode('domain')}
                className={`px-3 py-1.5 rounded transition-colors ${
                  mode === 'domain' ? 'bg-slate-800 text-slate-100 font-semibold border border-slate-700' : 'text-slate-400'
                }`}
              >
                Domain Collector
              </button>
              <button
                onClick={() => setMode('ip')}
                className={`px-3 py-1.5 rounded transition-colors ${
                  mode === 'ip' ? 'bg-slate-800 text-slate-100 font-semibold border border-slate-700' : 'text-slate-400'
                }`}
              >
                IP Collector
              </button>
            </div>

            <div className="flex-1 w-full relative">
              <input
                type="text"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder={mode === 'domain' ? 'Enter domain (e.g. acme-defense.org)...' : 'Enter IP (e.g. 198.51.100.24)...'}
                className="w-full bg-[#0d0f17] border border-slate-800 rounded px-3 py-1.5 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-600"
              />
            </div>

            <button
              onClick={handleFetchIntel}
              disabled={isLoading || !target.trim()}
              className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>Query Intelligence</span>
            </button>
          </div>

          {/* Intelligence Results JSON View */}
          {intelResult ? (
            <div className="matte-panel p-4 rounded border border-slate-800 space-y-2 font-mono text-xs shadow-xl">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-blue-400" />
                  RAW TELEMETRY PAYLOAD: {target}
                </span>
                <span className="text-[10px] text-slate-500">JSON FORMAT</span>
              </div>
              <pre className="p-3 rounded bg-[#090b10] border border-slate-800/90 overflow-x-auto text-[11px] text-slate-300 max-h-[500px]">
                {JSON.stringify(intelResult, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="matte-panel p-10 rounded border border-slate-800 text-center space-y-2">
              <Terminal className="w-8 h-8 text-slate-600 mx-auto" />
              <div className="text-xs font-mono text-slate-400">
                Enter a target domain or IP address above to query live reconnaissance modules.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
