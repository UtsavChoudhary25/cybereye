import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Search, AlertTriangle, CheckCircle2, Copy, 
  ExternalLink, Bot, Terminal, Code2, RefreshCw, Server, 
  Lock, Globe, FileCode, Check, ArrowRight
} from 'lucide-react';
import { Header } from '../components/common/Header';
import { Sidebar } from '../components/common/Sidebar';
import { Badge } from '../components/common/Badge';
import { AIAssistantPanel } from '../components/ai/AIAssistantPanel';
import { api } from '../services/api';
import { WebScanResult, VulnerabilityFinding, WebScanPreset } from '../types';

export const WebScannerPage: React.FC = () => {
  const [urlInput, setUrlInput] = useState('https://example.com');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<WebScanResult | null>(null);
  const [presets, setPresets] = useState<WebScanPreset[]>([]);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected framework tab per finding { [findingId]: 'nginx' | 'apache' | 'express' | 'nextjs' | 'django' }
  const [activeFrameworkTab, setActiveFrameworkTab] = useState<Record<string, string>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [expandedFindings, setExpandedFindings] = useState<Record<string, boolean>>({});
  
  // AI Assistant Modal
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [aiInitialQuery, setAiInitialQuery] = useState('');

  // Load presets on mount
  useEffect(() => {
    const fetchPresets = async () => {
      try {
        const data = await api.getScanPresets();
        setPresets(data);
      } catch (err) {
        console.error('Failed to load presets', err);
      }
    };
    fetchPresets();
  }, []);

  const handleRunScan = async (targetToScan?: string) => {
    const target = (targetToScan || urlInput).trim();
    if (!target || isScanning) return;

    setIsScanning(true);
    try {
      const res = await api.scanWebsite(target);
      setScanResult(res);
      // Auto-expand the first 2 findings by default
      if (res.findings && res.findings.length > 0) {
        const initialExpanded: Record<string, boolean> = {};
        res.findings.forEach((f, idx) => {
          initialExpanded[f.id] = idx < 2;
        });
        setExpandedFindings(initialExpanded);
      }
    } catch (err) {
      console.error('Web vulnerability scan failed:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleCopyCode = (findingId: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedKey(findingId);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  const handleAskAI = (finding: VulnerabilityFinding) => {
    const query = `How do I remediate "${finding.title}" (${finding.owasp_category || 'Security Misconfiguration'})? Please provide step-by-step defensive hardening and explain the risk impact.`;
    setAiInitialQuery(query);
    setIsAIOpen(true);
  };

  const toggleExpandFinding = (findingId: string) => {
    setExpandedFindings((prev) => ({ ...prev, [findingId]: !prev[findingId] }));
  };

  const setFrameworkForFinding = (findingId: string, fw: string) => {
    setActiveFrameworkTab((prev) => ({ ...prev, [findingId]: fw }));
  };

  // Filtered findings list
  const filteredFindings = (scanResult?.findings || []).filter((f) => {
    if (selectedSeverity !== 'ALL' && f.severity !== selectedSeverity) return false;
    if (selectedCategory !== 'ALL' && f.category !== selectedCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        f.title.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getGradeBadgeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'bg-emerald-950/80 text-emerald-300 border-emerald-700 ring-1 ring-emerald-500/30';
    if (grade === 'B') return 'bg-blue-950/80 text-blue-300 border-blue-700 ring-1 ring-blue-500/30';
    if (grade === 'C') return 'bg-amber-950/80 text-amber-300 border-amber-700 ring-1 ring-amber-500/30';
    return 'bg-red-950/80 text-red-300 border-red-700 ring-1 ring-red-500/30';
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0a0c12] text-slate-100 overflow-hidden font-sans select-none">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {/* Page Title & Mission Banner */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
                <h1 className="text-base font-mono font-bold text-slate-100 tracking-wide">
                  WEB VULNERABILITY SCANNER & REMEDIATION CENTER
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950/70 border border-blue-800 text-blue-300 font-semibold uppercase">
                  Automated Audit & Fix Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans mt-1">
                Perform safe, non-destructive security audits against web applications. Discover real HTTP header, cookie, TLS, and DNS exposures with ready-to-deploy multi-framework code patches.
              </p>
            </div>
          </div>

          {/* Target Input & Scan Launcher */}
          <div className="matte-card p-4 rounded-lg border border-slate-800 space-y-3">
            <div className="flex flex-col md:flex-row items-center gap-2.5">
              <div className="relative flex-1 w-full">
                <Globe className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Enter target URL to scan (e.g. https://example.com or domain.com)..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleRunScan(); }}
                  disabled={isScanning}
                  className="w-full bg-[#0d0f17] border border-slate-700/80 rounded pl-9 pr-4 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <button
                onClick={() => handleRunScan()}
                disabled={isScanning}
                className="w-full md:w-auto px-5 py-2 rounded bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-mono font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-lg shadow-blue-950/50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                <span>{isScanning ? 'Auditing Target...' : 'Scan Website'}</span>
              </button>
            </div>

            {/* Quick Demo Target Presets */}
            {presets.length > 0 && (
              <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-mono text-slate-400">Quick Test Targets:</span>
                {presets.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setUrlInput(p.url);
                      handleRunScan(p.url);
                    }}
                    title={p.description}
                    className="px-2 py-1 rounded bg-[#0b0e16] hover:bg-slate-800 text-[11px] font-mono text-slate-300 border border-slate-800 hover:border-slate-700 transition-colors flex items-center gap-1"
                  >
                    <span>{p.title.split(' ')[0]}</span>
                    <ArrowRight className="w-2.5 h-2.5 text-slate-500" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Scanner Progress Animation */}
          {isScanning && (
            <div className="matte-card p-6 rounded-lg border border-blue-900/60 bg-blue-950/10 text-center space-y-3 animate-in fade-in duration-200">
              <div className="inline-flex p-3 rounded-full bg-blue-950/80 border border-blue-800 animate-pulse">
                <ShieldCheck className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-sm font-mono font-bold text-slate-200">
                Running Non-Destructive Web Vulnerability Audit...
              </h3>
              <p className="text-xs text-slate-400 font-sans max-w-md mx-auto">
                Validating TLS cipher suites, analyzing HTTP security headers, inspecting cookie flags, checking DNS SPF/DMARC records, and assembling framework remediation code blocks.
              </p>
            </div>
          )}

          {/* Scan Results Viewport */}
          {scanResult && !isScanning && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Top Security Scorecard */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-3.5">
                {/* Grade & Score Card */}
                <div className="matte-card p-4 rounded-lg border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-mono uppercase text-slate-400">Security Posture Grade</div>
                    <div className="text-2xl font-mono font-extrabold text-slate-100 mt-0.5">
                      {scanResult.overall_score}<span className="text-xs text-slate-500 font-normal"> / 100</span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 mt-1">
                      {scanResult.overall_score >= 80 ? 'Low Exposure' : scanResult.overall_score >= 60 ? 'Moderate Risk' : 'Critical Exposure'}
                    </div>
                  </div>
                  <div className={`px-4 py-2 rounded-lg text-2xl font-mono font-black border ${getGradeBadgeColor(scanResult.overall_grade)}`}>
                    {scanResult.overall_grade}
                  </div>
                </div>

                {/* Target Metadata */}
                <div className="matte-card p-4 rounded-lg border border-slate-800 space-y-1.5 lg:col-span-2">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Target Hostname:</span>
                    <strong className="text-slate-200">{scanResult.normalized_domain}</strong>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Server Banner:</span>
                    <span className="text-slate-300 truncate max-w-[200px]">{scanResult.server_banner || 'Suppressed'}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400">IP Resolution:</span>
                    <span className="text-slate-300">{scanResult.ip_address}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Audit Duration:</span>
                    <span className="text-emerald-400 font-semibold">{scanResult.scan_duration_ms} ms</span>
                  </div>
                </div>

                {/* Findings Breakdown Strip */}
                <div className="matte-card p-4 rounded-lg border border-slate-800 flex flex-col justify-between">
                  <div className="text-[10px] font-mono uppercase text-slate-400">Vulnerabilities Detected</div>
                  <div className="flex items-center gap-2 my-1">
                    <span className="px-2 py-0.5 rounded bg-red-950/70 border border-red-800 text-red-300 text-xs font-mono font-bold">
                      {scanResult.findings_count.critical} Crit
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-950/70 border border-amber-800 text-amber-300 text-xs font-mono font-bold">
                      {scanResult.findings_count.high} High
                    </span>
                    <span className="px-2 py-0.5 rounded bg-blue-950/70 border border-blue-800 text-blue-300 text-xs font-mono font-bold">
                      {scanResult.findings_count.medium} Med
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>{scanResult.findings_count.passed} Controls Verified Secure</span>
                  </div>
                </div>
              </div>

              {/* Filter and Search Bar for Findings */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0d0f17] p-3 rounded-lg border border-slate-800">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative w-56">
                    <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Filter findings by keyword..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#0a0c12] border border-slate-800 rounded pl-8 pr-3 py-1.5 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-700"
                    />
                  </div>

                  {/* Severity Filter Pills */}
                  <div className="flex items-center gap-1 bg-[#0a0c12] p-0.5 rounded border border-slate-800">
                    {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
                      <button
                        key={sev}
                        onClick={() => setSelectedSeverity(sev)}
                        className={`px-2 py-1 rounded text-[10px] font-mono transition-colors ${
                          selectedSeverity === sev 
                            ? 'bg-slate-800 text-slate-100 font-bold' 
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {sev}
                      </button>
                    ))}
                  </div>

                  {/* Category Filter */}
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-[#0a0c12] border border-slate-800 rounded px-2.5 py-1 text-xs font-mono text-slate-300 focus:outline-none focus:border-slate-700"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="Headers">HTTP Headers</option>
                    <option value="Cookies">Cookie Hygiene</option>
                    <option value="TLS/SSL">TLS / Cryptography</option>
                    <option value="Information Disclosure">Information Disclosure</option>
                    <option value="DNS Spoofing">DNS & Email Spoofing</option>
                  </select>
                </div>

                <div className="text-xs font-mono text-slate-400">
                  Showing <strong>{filteredFindings.length}</strong> of {scanResult.findings.length} findings
                </div>
              </div>

              {/* Findings & Remediation Cards List */}
              <div className="space-y-4">
                {filteredFindings.map((finding) => {
                  const isExpanded = expandedFindings[finding.id] !== false;
                  const activeFramework = activeFrameworkTab[finding.id] || 'nginx';
                  const remediation = finding.remediations[activeFramework] || Object.values(finding.remediations)[0];
                  const isCopied = copiedKey === finding.id;

                  return (
                    <div
                      key={finding.id}
                      className="matte-card rounded-lg border border-slate-800/90 overflow-hidden font-mono text-xs transition-colors"
                    >
                      {/* Finding Header */}
                      <div className="p-4 bg-[#0d0f17] flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge severity={finding.severity} />
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-semibold">
                              {finding.category}
                            </span>
                            {finding.owasp_category && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950/40 border border-blue-900/40 text-blue-300">
                                {finding.owasp_category}
                              </span>
                            )}
                            {finding.cwe_id && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                                {finding.cwe_id}
                              </span>
                            )}
                          </div>
                          <h3 className="text-sm font-sans font-bold text-slate-100">
                            {finding.title}
                          </h3>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleAskAI(finding)}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-blue-300 font-mono text-[11px] font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
                          >
                            <Bot className="w-3 h-3 text-blue-400" />
                            <span>Ask AI Fix</span>
                          </button>
                          <button
                            onClick={() => toggleExpandFinding(finding.id)}
                            className="px-3 py-1 rounded bg-blue-950/80 hover:bg-blue-900 border border-blue-800 text-blue-300 font-mono text-[11px] font-bold transition-colors"
                          >
                            {isExpanded ? 'Hide Fix' : 'How to Fix It →'}
                          </button>
                        </div>
                      </div>

                      {/* Finding Details: Evidence & Exploit Impact */}
                      <div className="p-4 space-y-3 bg-[#0a0c12]">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Evidence Observed */}
                          <div className="p-3 rounded bg-[#0e111a] border border-slate-800/80 space-y-1">
                            <div className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1">
                              <Terminal className="w-3 h-3 text-slate-400" />
                              Observed Evidence
                            </div>
                            <div className="text-xs text-slate-300 font-mono break-all">
                              {finding.evidence}
                            </div>
                          </div>

                          {/* Exploit / Risk Impact */}
                          <div className="p-3 rounded bg-red-950/15 border border-red-900/30 space-y-1">
                            <div className="text-[10px] font-mono uppercase text-red-400 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-red-400" />
                              Security Exploit Impact
                            </div>
                            <p className="text-xs font-sans text-red-200/90 leading-relaxed">
                              {finding.impact}
                            </p>
                          </div>
                        </div>

                        {/* Feature 2: Dedicated "How to Fix It" Remediation Section */}
                        {isExpanded && remediation && (
                          <div className="mt-3 pt-3 border-t border-slate-800 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <Code2 className="w-4 h-4 text-emerald-400" />
                                <span className="font-bold text-slate-200 text-xs uppercase tracking-wider">
                                  How to Fix It — Ready-to-Deploy Code Patch
                                </span>
                              </div>

                              {/* Multi-Framework Switcher Tabs */}
                              <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded border border-slate-800">
                                {Object.keys(finding.remediations).map((fw) => (
                                  <button
                                    key={fw}
                                    onClick={() => setFrameworkForFinding(finding.id, fw)}
                                    className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase transition-colors ${
                                      activeFramework === fw
                                        ? 'bg-blue-600 text-white font-bold'
                                        : 'text-slate-400 hover:text-slate-200'
                                    }`}
                                  >
                                    {fw}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Code Snippet Box */}
                            <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-[#07090e]">
                              <div className="px-3 py-1.5 bg-[#0e111a] border-b border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                                  <FileCode className="w-3.5 h-3.5 text-blue-400" />
                                  <span>{remediation.filename}</span>
                                </div>
                                <button
                                  onClick={() => handleCopyCode(finding.id, remediation.code)}
                                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-mono flex items-center gap-1 border border-slate-700 transition-colors"
                                >
                                  {isCopied ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-400" />
                                      <span className="text-emerald-400 font-bold">Copied!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3 text-slate-400" />
                                      <span>Copy Patch</span>
                                    </>
                                  )}
                                </button>
                              </div>

                              <pre className="p-3 text-xs font-mono text-emerald-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                                <code>{remediation.code}</code>
                              </pre>

                              {/* Step-by-step instructions */}
                              {remediation.instructions && (
                                <div className="p-2.5 bg-[#0b0e16] border-t border-slate-800/80 text-[11px] font-sans text-slate-400 whitespace-pre-line leading-relaxed">
                                  {remediation.instructions}
                                </div>
                              )}
                            </div>

                            {/* Verification Command */}
                            {finding.verification_command && (
                              <div className="p-2.5 rounded bg-[#0b0e16] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                                <div className="flex items-center gap-2 text-slate-400 font-mono">
                                  <span className="text-blue-400 font-bold">Verify Fix:</span>
                                  <code className="text-slate-200 bg-slate-900 px-1.5 py-0.5 rounded">
                                    {finding.verification_command}
                                  </code>
                                </div>
                                <button
                                  onClick={() => handleCopyCode(finding.id + '_verify', finding.verification_command || '')}
                                  className="text-slate-400 hover:text-slate-200 font-mono text-[10px] shrink-0"
                                >
                                  Copy Command
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Verified Secure Controls Section */}
              {scanResult.passed_checks && scanResult.passed_checks.length > 0 && (
                <div className="matte-card p-4 rounded-lg border border-slate-800 space-y-3">
                  <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Verified Secure Controls ({scanResult.passed_checks.length} Passed)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
                    {scanResult.passed_checks.map((checkText, i) => (
                      <div
                        key={i}
                        className="p-2 rounded bg-emerald-950/20 border border-emerald-900/40 text-emerald-300 flex items-center gap-2"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{checkText}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Defensive AI Analyst Modal */}
      <AIAssistantPanel
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        targetContext={scanResult?.normalized_domain || urlInput}
        initialQuery={aiInitialQuery}
      />
    </div>
  );
};
