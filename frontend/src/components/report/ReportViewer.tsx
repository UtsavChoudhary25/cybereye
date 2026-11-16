import React from 'react';
import { Printer, Shield, Eye, FileText, CheckCircle2, X } from 'lucide-react';
import { Report } from '../../types';

interface ReportViewerProps {
  report: Report | null;
  onClose: () => void;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({ report, onClose }) => {
  if (!report) return null;

  const content = report.content_json || {};
  const meta = content.meta || {};
  const risk = content.risk_assessment || {};

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#090b10]/90 flex items-center justify-center p-4 md:p-8 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#0f121d] border border-slate-800 rounded-lg shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Top Control Bar */}
        <div className="p-3.5 border-b border-slate-800 bg-[#0a0c12] flex items-center justify-between no-print">
          <div className="flex items-center gap-2 text-slate-200 font-mono text-xs font-bold">
            <FileText className="w-4 h-4 text-blue-400" />
            <span>DEFENSIVE INTELLIGENCE DOSSIER</span>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Export PDF
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Report Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 font-sans text-slate-200 bg-[#0c0e17] print:bg-white print:text-black">
          {/* Header Banner */}
          <div className="border-b border-slate-800 pb-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 text-slate-100 text-lg font-mono font-bold">
                <Eye className="w-5 h-5 text-blue-400" />
                <span>CYBEREYE</span>
              </div>
              <div className="text-xs font-mono text-slate-400 mt-0.5">
                Defensive Threat Telemetry & Correlation
              </div>
            </div>
            <div className="text-right font-mono text-xs space-y-1">
              <div className="text-amber-400 font-semibold tracking-wider">{meta.classification || 'TLP:AMBER - DEFENSIVE DISCLOSURE'}</div>
              <div className="text-slate-400">ID: {meta.report_id || `CE-INTEL-${report.id}`}</div>
              <div className="text-slate-500">{meta.generated_at || new Date(report.created_at).toUTCString()}</div>
            </div>
          </div>

          {/* Target Title & Risk Score */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 matte-panel p-4 rounded border border-slate-800">
              <div className="text-xs font-mono text-slate-400 uppercase">Assessment Target</div>
              <div className="text-xl font-bold font-mono text-slate-100 mt-1">{report.target}</div>
              <div className="text-xs text-slate-400 mt-1.5">
                Passive intelligence correlation, DNS zone records, autonomous system telemetry, and CVE advisory matching.
              </div>
            </div>

            <div className="matte-panel p-4 rounded border border-slate-800 flex flex-col items-center justify-center text-center">
              <div className="text-xs font-mono uppercase text-slate-400">Heuristic Risk Score</div>
              <div className="text-3xl font-mono font-bold text-slate-100 mt-1">{risk.score || 76}</div>
              <div className="text-xs font-mono font-semibold text-amber-400 mt-0.5">{risk.level || 'HIGH'} RISK</div>
              <div className="text-[10px] font-mono text-slate-500 mt-1">Normalized 0-100</div>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-blue-400" /> 1. Executive Summary
            </h4>
            <div className="p-4 rounded bg-[#111420] border border-slate-800 text-xs leading-relaxed text-slate-300">
              {content.executive_summary || report.executive_summary}
            </div>
          </div>

          {/* Observed Assets */}
          {content.observed_assets && (
            <div className="space-y-2">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                2. Perimeter Telemetry Inventory
              </h4>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
                {content.observed_assets.map((a: string, i: number) => (
                  <li key={i} className="p-2 rounded bg-[#111420] border border-slate-800 text-slate-300 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Vulnerability Intelligence */}
          {content.vulnerabilities && (
            <div className="space-y-2">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-red-400">
                3. Potentially Relevant Vulnerabilities
              </h4>
              <div className="space-y-2 text-xs">
                {content.vulnerabilities.map((v: string, i: number) => (
                  <div key={i} className="p-3 rounded bg-red-950/20 border border-red-900/40 text-red-200">
                    {v}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Defensive Actions */}
          {content.recommended_actions && (
            <div className="space-y-2">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                4. Prioritized Mitigation Controls
              </h4>
              <div className="space-y-1.5 text-xs">
                {content.recommended_actions.map((act: string, i: number) => (
                  <div key={i} className="p-2.5 rounded bg-emerald-950/20 border border-emerald-900/40 text-emerald-200 flex items-start gap-2">
                    <span className="font-bold font-mono text-emerald-400">#{i + 1}</span>
                    <span>{act}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Limitations Disclaimer */}
          <div className="p-3.5 rounded bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400 font-mono space-y-1">
            <div className="text-slate-300 font-semibold uppercase">Defensive Boundaries & Disclaimers</div>
            <p>
              {content.disclaimer || 'CyberEye operates strictly under defensive security research and educational boundaries.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
