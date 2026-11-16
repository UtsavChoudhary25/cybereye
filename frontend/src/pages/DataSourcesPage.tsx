import React, { useState, useEffect } from 'react';
import { Database, ExternalLink, RefreshCw, CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';
import { Header } from '../components/common/Header';
import { Sidebar } from '../components/common/Sidebar';
import { api } from '../services/api';

interface ProviderStatus {
  name: string;
  category: string;
  status: string;
  is_configured: boolean;
  last_update?: string;
  items_count: number;
  message?: string;
  docs_url?: string;
}

export const DataSourcesPage: React.FC = () => {
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const fetchLiveStatuses = async () => {
    setLoading(true);
    try {
      const res = await api.getLiveProviderStatuses();
      setProviders(res);
    } catch (err) {
      console.error('Failed to load live data source statuses', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveStatuses();
  }, []);

  const handleSyncAll = async () => {
    setIsSyncing(true);
    try {
      await api.syncFeeds();
      await fetchLiveStatuses();
    } catch (err) {
      console.error('Failed to synchronize all providers', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ONLINE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border bg-emerald-950/50 text-emerald-400 border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            ONLINE
          </span>
        );
      case 'CONFIGURED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border bg-blue-950/50 text-blue-400 border-blue-800">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            CONFIGURED
          </span>
        );
      case 'NOT_CONFIGURED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border bg-amber-950/50 text-amber-400 border-amber-800">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            NOT CONFIGURED (OPEN CATALOG)
          </span>
        );
      case 'DEGRADED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border bg-yellow-950/50 text-yellow-400 border-yellow-800">
            <AlertTriangle className="w-3 h-3 text-yellow-400" />
            DEGRADED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border bg-red-950/50 text-red-400 border-red-800">
            <XCircle className="w-3 h-3 text-red-400" />
            OFFLINE
          </span>
        );
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0a0c12] text-slate-100 overflow-hidden font-sans select-none">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-mono font-bold text-slate-100 flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-400" />
                DATA SOURCE REGISTRY & REAL-TIME CONNECTIVITY
              </h2>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Authentic verification status of all integrated public transportation, USGS seismic, CISA KEV, meteorological, and DNS/BGP providers.
              </p>
            </div>

            <button
              onClick={handleSyncAll}
              disabled={isSyncing}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs flex items-center gap-1.5 border border-slate-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Synchronizing Providers...' : 'Sync All Feeds Now'}</span>
            </button>
          </div>

          {/* Sources Table */}
          <div className="matte-panel rounded border border-slate-800 overflow-hidden shadow-xl">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-[#0f121d] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Provider Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Live Items</th>
                  <th className="px-4 py-3">Last Checked</th>
                  <th className="px-4 py-3">Diagnostics</th>
                  <th className="px-4 py-3 text-right">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500 font-mono">
                      Querying live provider health status...
                    </td>
                  </tr>
                ) : (
                  providers.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-100">
                        {p.name}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {p.category}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(p.status)}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        <span className="font-bold text-slate-200">{p.items_count}</span>
                        <span className="text-slate-500 text-[10px] ml-1">ingested</span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-[11px]">
                        {p.last_update ? (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            {new Date(p.last_update).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} UTC
                          </span>
                        ) : (
                          'Pending Sync'
                        )}
                      </td>
                      <td className="px-4 py-3 font-sans text-slate-400 text-xs max-w-xs truncate">
                        {p.message}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {p.docs_url && (
                          <a
                            href={p.docs_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-blue-400 hover:underline text-xs"
                          >
                            <span>Documentation</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

