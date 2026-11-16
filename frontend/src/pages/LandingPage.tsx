import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Eye, Globe, SearchCheck, ArrowRight, Activity 
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0c12] text-slate-100 flex flex-col font-sans select-none overflow-x-hidden">
      {/* Top Navbar */}
      <nav className="h-16 border-b border-slate-800/80 px-6 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-200">
            <Eye className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <span className="font-mono font-bold tracking-widest text-base text-slate-100 flex items-center">
              CYBER<span className="text-blue-400">EYE</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/investigate?target=acme-defense.org')}
            className="px-3.5 py-1.5 rounded bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            Sample Investigation
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-3.5 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors"
          >
            Launch Command Center
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center relative overflow-hidden">
        <div className="relative z-10 max-w-4xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono mb-2">
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            <span>CYBER INTELLIGENCE & OSINT VISUALIZATION PLATFORM</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight font-sans text-slate-100">
            See the signal. <br />
            <span className="text-slate-300">
              Understand the threat.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-xs sm:text-sm text-slate-400 font-sans leading-relaxed">
            CyberEye unifies public cybersecurity telemetry, BGP routing anomalies, DNS infrastructure records, and vulnerability disclosures. 
            Visualize planetary telemetry on an interactive 3D globe and 2D planar projection, explore multi-entity relationship graphs, 
            and generate automated defensive intelligence dossiers.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full sm:w-auto px-5 py-2.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Globe className="w-4 h-4" />
              Launch SOC Command Center
            </button>
            <button
              onClick={() => navigate('/investigate?target=acme-defense.org')}
              className="w-full sm:w-auto px-5 py-2.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-mono text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <SearchCheck className="w-4 h-4 text-slate-400" />
              Analyze Target: acme-defense.org
            </button>
          </div>
        </div>

        {/* 4-Step Intelligence Pipeline Diagram */}
        <div className="mt-16 w-full max-w-5xl px-4">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-widest mb-4">
            Architectural Workflow Pipeline
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-left">
            <div className="matte-card p-4 rounded border border-slate-800 space-y-2">
              <div className="w-6 h-6 rounded bg-slate-800 text-slate-300 flex items-center justify-center font-mono font-bold text-xs">
                01
              </div>
              <h3 className="font-mono text-xs font-bold text-slate-200">Collect</h3>
              <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                Passive DNS queries, BGP Autonomous System lookups, TLS cert logs, and defensive security headers.
              </p>
            </div>

            <div className="matte-card p-4 rounded border border-slate-800 space-y-2">
              <div className="w-6 h-6 rounded bg-slate-800 text-slate-300 flex items-center justify-center font-mono font-bold text-xs">
                02
              </div>
              <h3 className="font-mono text-xs font-bold text-slate-200">Correlate</h3>
              <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                Link target domains to IPs, ASN routing prefixes, hosting organizations, and public CVE advisory disclosures.
              </p>
            </div>

            <div className="matte-card p-4 rounded border border-slate-800 space-y-2">
              <div className="w-6 h-6 rounded bg-slate-800 text-slate-300 flex items-center justify-center font-mono font-bold text-xs">
                03
              </div>
              <h3 className="font-mono text-xs font-bold text-slate-200">Visualize</h3>
              <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                Interactive 3D CesiumJS globe with attack arcs alongside a force-directed multi-node Threat Graph.
              </p>
            </div>

            <div className="matte-card p-4 rounded border border-slate-800 space-y-2">
              <div className="w-6 h-6 rounded bg-slate-800 text-slate-300 flex items-center justify-center font-mono font-bold text-xs">
                04
              </div>
              <h3 className="font-mono text-xs font-bold text-slate-200">Analyze</h3>
              <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                Calculate transparent heuristic risk scores and query defensive intelligence for actionable posture playbooks.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 px-6 text-center text-xs font-mono text-slate-500">
        CYBEREYE — Production-Quality Educational & Defensive Cyber Intelligence Platform • MCA Capstone
      </footer>
    </div>
  );
};
