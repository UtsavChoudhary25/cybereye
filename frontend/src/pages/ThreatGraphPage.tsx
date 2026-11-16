import React, { useState, useEffect } from 'react';
import { Share2, RefreshCw } from 'lucide-react';
import { Header } from '../components/common/Header';
import { Sidebar } from '../components/common/Sidebar';
import { ThreatGraph } from '../components/graph/ThreatGraph';
import { api } from '../services/api';
import { ThreatGraph as IThreatGraph, GraphNode } from '../types';

export const ThreatGraphPage: React.FC = () => {
  const [selectedTarget, setSelectedTarget] = useState('acme-defense.org');
  const [graphData, setGraphData] = useState<IThreatGraph | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [, setInspectedNode] = useState<GraphNode | null>(null);

  useEffect(() => {
    const fetchGraph = async () => {
      setIsLoading(true);
      try {
        const invs = await api.getInvestigations();
        const matched = invs.find((i) => i.target === selectedTarget) || invs[0];
        if (matched) {
          const res = await api.getThreatGraph(matched.id);
          setGraphData(res);
        } else {
          // Create investigation if not already present
          const created = await api.createInvestigation({
            target: selectedTarget,
            authorized_for_active_checks: true
          });
          setGraphData(created.threat_graph);
        }
      } catch (err) {
        console.error('Failed to load threat graph', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchGraph();
  }, [selectedTarget]);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0a0c12] text-slate-100 overflow-hidden font-sans select-none">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        <div className="flex-1 flex flex-col p-4 md:p-6 space-y-4 overflow-hidden">
          {/* Top Bar with Target Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 matte-panel p-4 rounded border border-slate-800">
            <div>
              <h2 className="text-sm font-mono font-bold text-slate-100 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-blue-400" />
                FORCE-DIRECTED THREAT & ENTITY RELATIONSHIP EXPLORER
              </h2>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Map cross-domain connections between IP endpoints, BGP prefixes, organizations, and vulnerabilities.
              </p>
            </div>

            {/* Target Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">Target:</span>
              <select
                value={selectedTarget}
                onChange={(e) => setSelectedTarget(e.target.value)}
                className="bg-[#0d0f17] border border-slate-800 rounded px-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-slate-600"
              >
                <option value="acme-defense.org">acme-defense.org</option>
                <option value="fintech-global.io">fintech-global.io</option>
                <option value="8.8.8.8">8.8.8.8 (Google DNS)</option>
              </select>
            </div>
          </div>

          {/* Graph Viewport */}
          <div className="flex-1 relative rounded overflow-hidden border border-slate-800 bg-[#0b0d13]">
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-[#0b0d13]/80 z-20">
                <div className="text-center font-mono space-y-2">
                  <RefreshCw className="w-6 h-6 text-blue-400 animate-spin mx-auto" />
                  <div className="text-xs text-slate-400 uppercase tracking-wider">
                    Simulating Entity Topology...
                  </div>
                </div>
              </div>
            ) : (
              <ThreatGraph
                nodes={graphData?.nodes || []}
                edges={graphData?.edges || []}
                onSelectNode={(node) => setInspectedNode(node)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
