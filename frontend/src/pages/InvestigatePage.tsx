import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, AlertTriangle, CheckCircle2, Bot, 
  FileText, Share2, Server, RefreshCw 
} from 'lucide-react';
import { Header } from '../components/common/Header';
import { Sidebar } from '../components/common/Sidebar';
import { ThreatGraph } from '../components/graph/ThreatGraph';
import { RiskScoreCard } from '../components/intelligence/RiskScoreCard';
import { AIAssistantPanel } from '../components/ai/AIAssistantPanel';
import { ReportViewer } from '../components/report/ReportViewer';
import { api } from '../services/api';
import { RiskAssessment, ThreatGraph as IThreatGraph, Report } from '../types';

export const InvestigatePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialTarget = searchParams.get('target') || 'acme-defense.org';

  const [targetInput, setTargetInput] = useState(initialTarget);
  const [targetType, setTargetType] = useState('domain');
  const [authorizedChecked, setAuthorizedChecked] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // Investigation Results State
  const [investigationData, setInvestigationData] = useState<any>(null);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);
  const [threatGraph, setThreatGraph] = useState<IThreatGraph | null>(null);
  const [aiSummaryData, setAiSummaryData] = useState<any>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // Modal / Flyout State
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [currentReport, setCurrentReport] = useState<Report | null>(null);

  // Auto-run investigation on mount if target in search param
  useEffect(() => {
    if (initialTarget) {
      handleRunInvestigation(initialTarget);
    }
  }, [initialTarget]);

  const handleRunInvestigation = async (targetToScan?: string) => {
    const target = (targetToScan || targetInput).trim();
    if (!target || isScanning) return;

    setIsScanning(true);
    setInvestigationData(null);
    setRiskAssessment(null);
    setThreatGraph(null);
    setAiSummaryData(null);

    try {
      const res = await api.createInvestigation({
        target,
        target_type: targetType,
        authorized_for_active_checks: authorizedChecked,
        notes: `User initiated investigation via CyberEye SOC Console.`
      });

      setInvestigationData(res);
      setRiskAssessment(res.risk_assessment);
      setThreatGraph(res.threat_graph);
    } catch (err: any) {
      console.error('Investigation failed:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!investigationData?.investigation_id) return;
    setIsGeneratingSummary(true);
    try {
      const summary = await api.aiSummary(investigationData.investigation_id);
      setAiSummaryData(summary);
    } catch (err) {
      console.error('Failed to generate summary', err);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!investigationData?.investigation_id) return;
    try {
      const rep = await api.createReport(investigationData.investigation_id);
      setCurrentReport(rep);
    } catch (err) {
      console.error('Failed to generate report', err);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0a0c12] text-slate-100 overflow-hidden font-sans select-none">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {/* Target Query Control Box */}
          <div className="matte-panel p-5 rounded border border-slate-800 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-mono font-bold text-slate-100 flex items-center gap-2">
                  <Search className="w-4 h-4 text-blue-400" />
                  DEFENSIVE OSINT INVESTIGATION ENGINE
                </h2>
                <p className="text-xs text-slate-400 font-sans mt-0.5">
                  Execute passive discovery across DNS, BGP routing, public certificates, technology stacks, and vulnerability disclosures.
                </p>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-slate-500 text-[11px]">Quick Targets:</span>
                {[
                  { name: 'acme-defense.org', type: 'domain' },
                  { name: 'fintech-global.io', type: 'domain' },
                  { name: '8.8.8.8', type: 'ip' },
                ].map((demo) => (
                  <button
                    key={demo.name}
                    onClick={() => {
                      setTargetInput(demo.name);
                      setTargetType(demo.type);
                      handleRunInvestigation(demo.name);
                    }}
                    className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors text-xs"
                  >
                    {demo.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Form */}
            <div className="flex flex-col md:flex-row items-stretch gap-2.5">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Enter target domain (e.g. acme-defense.org), IP address (e.g. 198.51.100.24), or Org..."
                  value={targetInput}
                  onChange={(e) => setTargetInput(e.target.value)}
                  className="w-full bg-[#0d0f17] border border-slate-800 rounded px-3.5 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-slate-600 transition-colors"
                />
              </div>

              <select
                value={targetType}
                onChange={(e) => setTargetType(e.target.value)}
                className="bg-[#0d0f17] border border-slate-800 rounded px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-slate-600"
              >
                <option value="domain">Target: Domain</option>
                <option value="ip">Target: IP Address</option>
                <option value="organization">Target: Organization</option>
              </select>

              <button
                onClick={() => handleRunInvestigation()}
                disabled={isScanning || !targetInput.trim()}
                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {isScanning ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Collecting Telemetry...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    <span>Investigate Target</span>
                  </>
                )}
              </button>
            </div>

            {/* Mandatory Defensive Authorization Barrier */}
            <div className="pt-2.5 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-sans">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300">
                <input
                  type="checkbox"
                  checked={authorizedChecked}
                  onChange={(e) => setAuthorizedChecked(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
                />
                <span className="text-slate-300 text-[11px]">
                  I confirm I own or have explicit authorization to assess this target system.
                </span>
              </label>

              <div className="text-[10px] font-mono text-amber-400 flex items-center gap-1.5 bg-amber-950/30 px-2 py-0.5 rounded border border-amber-900/50">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                <span>Passive reconnaissance only. No intrusive exploitation is performed.</span>
              </div>
            </div>
          </div>

          {/* Investigation Findings Display */}
          {investigationData && (
            <div className="space-y-6">
              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 matte-panel rounded border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-mono text-slate-200">
                    Investigation Dossier Ready: <strong className="text-slate-100">{investigationData.target}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleGenerateSummary}
                    disabled={isGeneratingSummary}
                    className="px-2.5 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-mono font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-400" />
                    {isGeneratingSummary ? 'Synthesizing...' : 'Generate Intelligence Summary'}
                  </button>

                  <button
                    onClick={handleGenerateReport}
                    className="px-2.5 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Export Executive Dossier
                  </button>

                  <button
                    onClick={() => setIsAIOpen(true)}
                    className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-mono font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <Bot className="w-3.5 h-3.5 text-blue-400" />
                    Ask Defensive Advisor
                  </button>
                </div>
              </div>

              {/* Intelligence Summary Box */}
              {aiSummaryData && (
                <div className="matte-panel p-5 rounded border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-400" />
                      <h3 className="text-xs font-mono font-bold text-slate-100 uppercase tracking-wider">
                        EXECUTIVE DEFENSIVE INTELLIGENCE BRIEFING
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                      DEFENSIVE SYNTHESIS
                    </span>
                  </div>

                  <div className="p-3 rounded bg-slate-900/80 border border-slate-800 text-xs leading-relaxed text-slate-300">
                    {aiSummaryData.executive_summary}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-sans">
                    <div className="p-3 rounded bg-slate-900/40 border border-slate-800 space-y-2">
                      <h4 className="font-mono font-bold text-red-400 uppercase text-[10px]">
                        Identified Attack Surface & Risks
                      </h4>
                      <ul className="space-y-1">
                        {aiSummaryData.potential_risks.map((r: string, idx: number) => (
                          <li key={idx} className="text-slate-300 flex items-start gap-1.5">
                            <span className="text-red-400">•</span>
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 rounded bg-slate-900/40 border border-slate-800 space-y-2">
                      <h4 className="font-mono font-bold text-emerald-400 uppercase text-[10px]">
                        Recommended Defensive Actions
                      </h4>
                      <ul className="space-y-1">
                        {aiSummaryData.recommended_defensive_actions.map((a: string, idx: number) => (
                          <li key={idx} className="text-slate-300 flex items-start gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="text-[10px] font-mono text-slate-500 bg-[#090b10] p-2.5 rounded border border-slate-800">
                    <strong>Limitations:</strong> {aiSummaryData.confidence_and_limitations}
                  </div>
                </div>
              )}

              {/* Grid: Risk Score Card & Asset Exposure */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2">
                  <RiskScoreCard assessment={riskAssessment} />
                </div>

                {/* Primary Discovered Infrastructure Card */}
                <div className="matte-panel p-4 rounded border border-slate-800 space-y-3 font-mono text-xs">
                  <h3 className="text-xs uppercase font-bold text-slate-300 flex items-center gap-1.5 pb-2 border-b border-slate-800">
                    <Server className="w-3.5 h-3.5 text-blue-400" />
                    PRIMARY ASSET PROFILE
                  </h3>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Target:</span>
                      <span className="text-slate-200 font-bold">{investigationData.target}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Primary IP:</span>
                      <span className="text-slate-200">{investigationData.asset?.ip || '198.51.100.24'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">BGP ASN:</span>
                      <span className="text-slate-200">{investigationData.asset?.asn || 'AS40012'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Organization:</span>
                      <span className="text-slate-200 truncate max-w-[140px]">{investigationData.asset?.organization || 'Acme Defense'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Jurisdiction:</span>
                      <span className="text-slate-200">{investigationData.asset?.country || 'United States'}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 space-y-1.5">
                    <span className="text-[10px] text-slate-500 uppercase">Observed Tech Stack</span>
                    <div className="flex flex-wrap gap-1">
                      {(investigationData.asset?.technology || ['nginx/1.24.0', 'React 19', 'FastAPI', 'ModSecurity']).map((t: string, i: number) => (
                        <span key={i} className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Force-Directed Threat Graph Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono font-bold text-slate-200 flex items-center gap-2">
                    <Share2 className="w-3.5 h-3.5 text-blue-400" />
                    INTERACTIVE THREAT & ENTITY RELATIONSHIP GRAPH
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400">
                    Click & drag nodes • Scroll to zoom
                  </span>
                </div>
                <div className="h-[480px]">
                  <ThreatGraph nodes={threatGraph?.nodes || []} edges={threatGraph?.edges || []} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Defensive Advisor Chat Modal */}
      <AIAssistantPanel
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        targetContext={investigationData?.target}
      />

      {/* Report Viewer Modal */}
      <ReportViewer
        report={currentReport}
        onClose={() => setCurrentReport(null)}
      />
    </div>
  );
};
