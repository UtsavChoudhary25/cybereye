import React, { useState, useEffect } from 'react';
import { FileText, ArrowRight } from 'lucide-react';
import { Header } from '../components/common/Header';
import { Sidebar } from '../components/common/Sidebar';
import { ReportViewer } from '../components/report/ReportViewer';
import { api } from '../services/api';
import { Investigation, Report } from '../types';

export const ReportsPage: React.FC = () => {
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [loadingInvId, setLoadingInvId] = useState<number | null>(null);

  useEffect(() => {
    const fetchInvs = async () => {
      try {
        const res = await api.getInvestigations();
        setInvestigations(res);
      } catch (err) {
        console.error('Failed to load investigations', err);
      }
    };
    fetchInvs();
  }, []);

  const handleOpenReport = async (inv: Investigation) => {
    setLoadingInvId(inv.id);
    try {
      // Create or fetch report for this investigation
      const rep = await api.createReport(inv.id);
      setSelectedReport(rep);
    } catch (err) {
      console.error('Failed to open report', err);
    } finally {
      setLoadingInvId(null);
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
              <FileText className="w-4 h-4 text-blue-400" />
              EXECUTIVE INVESTIGATION REPORTS & DOSSIERS
            </h2>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Historical archive of completed passive threat investigations, risk scoring assessments, and exportable executive summaries.
            </p>
          </div>

          {/* Investigations History Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-mono text-xs">
            {investigations.map((inv) => (
              <div
                key={inv.id}
                className="matte-card p-4 rounded border border-slate-800 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-slate-500 uppercase">
                      INV-ID #{inv.id}
                    </span>
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] border ${
                      inv.risk_level === 'CRITICAL' || inv.risk_level === 'HIGH'
                        ? 'bg-red-950/40 text-red-400 border-red-900/60'
                        : 'bg-emerald-950/40 text-emerald-400 border-emerald-900/60'
                    }`}>
                      {inv.risk_level} ({inv.risk_score}/100)
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-100 truncate">
                    {inv.target}
                  </h3>

                  <p className="text-xs font-sans text-slate-400 mt-1 line-clamp-2">
                    {inv.notes || 'Automated defensive reconnaissance completed.'}
                  </p>
                </div>

                <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    {new Date(inv.created_at).toLocaleDateString()}
                  </span>

                  <button
                    onClick={() => handleOpenReport(inv)}
                    disabled={loadingInvId === inv.id}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <span>{loadingInvId === inv.id ? 'Loading...' : 'View Dossier'}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Report Viewer Modal */}
      <ReportViewer
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
      />
    </div>
  );
};
