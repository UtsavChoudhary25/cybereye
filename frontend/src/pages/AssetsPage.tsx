import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Server, Search } from 'lucide-react';
import { Header } from '../components/common/Header';
import { Sidebar } from '../components/common/Sidebar';
import { api } from '../services/api';
import { Asset } from '../types';

export const AssetsPage: React.FC = () => {
  const navigate = useNavigate();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const res = await api.getAssets({ limit: 100 });
        setAssets(res);
      } catch (err) {
        console.error('Failed to load assets', err);
      }
    };
    fetchAssets();
  }, []);

  const filtered = assets.filter((a) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      a.ip?.includes(q) ||
      a.hostname?.toLowerCase().includes(q) ||
      a.organization?.toLowerCase().includes(q) ||
      a.asn?.toLowerCase().includes(q) ||
      a.country?.toLowerCase().includes(q)
    );
  });

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
                <Server className="w-4 h-4 text-blue-400" />
                MONITORED PERIMETER ASSETS & INFRASTRUCTURE
              </h2>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Centralized inventory of discovered public IP addresses, hostnames, Autonomous Systems, and exposed stacks.
              </p>
            </div>

            {/* Search Filter */}
            <div className="relative w-64">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Filter IP, hostname, ASN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#0d0f17] border border-slate-800 rounded pl-8 pr-3 py-1.5 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-600"
              />
            </div>
          </div>

          {/* Assets Table */}
          <div className="matte-panel rounded border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-[#0f121d] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Hostname / Domain</th>
                    <th className="px-4 py-3">Public IP</th>
                    <th className="px-4 py-3">BGP ASN</th>
                    <th className="px-4 py-3">Organization</th>
                    <th className="px-4 py-3">Jurisdiction</th>
                    <th className="px-4 py-3">Risk Score</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filtered.map((asset) => (
                    <tr 
                      key={asset.id} 
                      className="hover:bg-slate-900/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-slate-200 font-bold">
                        {asset.hostname || asset.domain || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {asset.ip || 'Unknown'}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {asset.asn || 'AS-Unassigned'}
                      </td>
                      <td className="px-4 py-3 text-slate-300 truncate max-w-[180px]">
                        {asset.organization || 'Unregistered Entity'}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {asset.country || 'Global'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded font-bold text-xs border ${
                          (asset.risk_score || 0) >= 70 ? 'bg-red-950/40 text-red-400 border-red-900/60' :
                          (asset.risk_score || 0) >= 40 ? 'bg-amber-950/40 text-amber-400 border-amber-900/60' :
                          'bg-emerald-950/40 text-emerald-400 border-emerald-900/60'
                        }`}>
                          {asset.risk_score || 50}/100
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => navigate(`/investigate?target=${encodeURIComponent(asset.domain || asset.ip || '')}`)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] font-mono transition-colors"
                        >
                          Assess
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
