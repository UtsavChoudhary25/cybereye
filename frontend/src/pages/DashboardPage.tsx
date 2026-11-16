import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Radio, Server, Bug, Database, 
  Bot, RefreshCw, Zap, Crosshair, X, AlertTriangle
} from 'lucide-react';
import { Header } from '../components/common/Header';
import { Sidebar } from '../components/common/Sidebar';
import { StatCard } from '../components/common/StatCard';
import { CesiumGlobe } from '../components/globe/CesiumGlobe';
import { LayerControl, LayerState } from '../components/globe/LayerControl';
import { EventTimeline } from '../components/timeline/EventTimeline';
import { IntelPanel } from '../components/intelligence/IntelPanel';
import { AIAssistantPanel } from '../components/ai/AIAssistantPanel';
import { api } from '../services/api';
import { GlobalEvent } from '../types';

export const DashboardPage: React.FC = () => {
  const [events, setEvents] = useState<GlobalEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<GlobalEvent | null>(null);
  const [latestEventId, setLatestEventId] = useState<number | undefined>(undefined);
  const [incomingAlert, setIncomingAlert] = useState<GlobalEvent | null>(null);
  const [sseConnected, setSseConnected] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [aiInitialQuery, setAiInitialQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('');

  const [layers, setLayers] = useState<LayerState>({
    cyber: true,
    infrastructure: true,
    earthquakes: true,
    weather: true,
    transport: true,
    maritime: true,
    threat: true,
  });

  const [stats, setStats] = useState({
    activeEvents: 27,
    highRisk: 8,
    monitoredAssets: 14,
    vulnerabilities: 31,
    intelItems: 96,
  });

  // Load events and telemetry stats
  const fetchTelemetry = async () => {
    try {
      const [evs, assets, vulns] = await Promise.all([
        api.getEvents({ limit: 100 }),
        api.getAssets({ limit: 50 }),
        api.getVulnerabilities({ limit: 50 }),
      ]);

      if (evs.length > 0) {
        setEvents(evs);
        setSelectedEvent((curr) => curr || evs[0]);
      }

      setStats((s) => ({
        ...s,
        activeEvents: evs.length || s.activeEvents,
        highRisk: evs.filter((e) => e.severity === 'CRITICAL' || e.severity === 'HIGH').length,
        monitoredAssets: assets.length || 14,
        vulnerabilities: vulns.length || 31,
      }));
    } catch (err) {
      console.error('Failed to fetch dashboard events', err);
    }
  };

  useEffect(() => {
    fetchTelemetry();
  }, []);

  // Real-Time Server-Sent Events (SSE) stream
  useEffect(() => {
    let es: EventSource | null = null;
    try {
      es = new EventSource('/api/events/stream');
      es.onopen = () => {
        setSseConnected(true);
      };
      es.onmessage = (msg) => {
        try {
          const newEvent: GlobalEvent = JSON.parse(msg.data);
          if (!newEvent || !newEvent.id) return;

          setEvents((prev) => {
            if (prev.some((e) => e.id === newEvent.id)) return prev;
            return [newEvent, ...prev];
          });
          setLatestEventId(newEvent.id);
          setIncomingAlert(newEvent);

          setStats((prev) => ({
            ...prev,
            activeEvents: prev.activeEvents + 1,
            highRisk: (newEvent.severity === 'CRITICAL' || newEvent.severity === 'HIGH')
              ? prev.highRisk + 1
              : prev.highRisk,
          }));

          // Auto-dismiss alert toast after 8 seconds
          setTimeout(() => {
            setIncomingAlert((curr) => (curr?.id === newEvent.id ? null : curr));
          }, 8000);
        } catch (err) {
          console.error('Failed to parse incoming live event', err);
        }
      };
      es.onerror = () => {
        setSseConnected(false);
      };
    } catch (err) {
      console.warn('EventSource initialization failed', err);
    }

    return () => {
      if (es) es.close();
    };
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await api.syncFeeds();
      await fetchTelemetry();
    } catch (err) {
      console.error('Manual feed sync failed', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSimulateIncident = async () => {
    try {
      const inc = await api.simulateIncident();
      if (inc && inc.id) {
        setLatestEventId(inc.id);
        setSelectedEvent(inc);
      }
    } catch (err) {
      console.error('Incident simulation failed', err);
    }
  };

  const handleToggleLayer = (layer: keyof LayerState) => {
    setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  const handleAskAI = (query: string) => {
    setAiInitialQuery(query);
    setIsAIOpen(true);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0a0c12] text-slate-100 overflow-hidden font-sans select-none">
      {/* Top Command Bar */}
      <Header />

      {/* Main SOC Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Navigation Sidebar */}
        <Sidebar />

        {/* Center Command Viewport */}
        <div className="flex-1 flex flex-col relative overflow-hidden bg-[#0a0c12]">
          {/* Top Quick Stats Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 p-3 z-10 pointer-events-auto bg-gradient-to-b from-[#0a0c12] to-transparent">
            <StatCard
              label="Active Events"
              value={stats.activeEvents}
              subValue="+4 in 24h"
              icon={Radio}
              color="blue"
            />
            <StatCard
              label="High / Critical"
              value={stats.highRisk}
              subValue="Priority Triage"
              icon={ShieldAlert}
              color="rose"
            />
            <StatCard
              label="Monitored Assets"
              value={stats.monitoredAssets}
              subValue="Perimeter IPs"
              icon={Server}
              color="emerald"
            />
            <StatCard
              label="Vulnerabilities"
              value={stats.vulnerabilities}
              subValue="Unverified CVEs"
              icon={Bug}
              color="amber"
            />
            <StatCard
              label="Threat Intel"
              value={stats.intelItems}
              subValue="Correlated Signals"
              icon={Database}
              color="purple"
            />
          </div>

          {/* Planetary Viewport (Cesium 3D + 2D Planar Fallback) */}
          <div className="flex-1 relative overflow-hidden">
            <CesiumGlobe
              events={events}
              layers={layers}
              selectedSeverity={selectedSeverity}
              onSelectEvent={(ev) => setSelectedEvent(ev)}
              selectedEventId={selectedEvent?.id}
              latestEventId={latestEventId}
            />

            {/* Top-Right Live Stream Action Controls */}
            <div className="absolute top-3 right-3 z-20 flex items-center gap-2 pointer-events-auto">
              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                title="Synchronize live USGS and CISA feeds now"
                className="px-2.5 py-1.5 rounded bg-slate-900/90 hover:bg-slate-800 text-slate-300 font-mono text-[11px] flex items-center gap-1.5 border border-slate-700/80 shadow-md backdrop-blur transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 text-blue-400 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing Feeds...' : 'Sync Real Feeds'}</span>
              </button>

              <button
                onClick={handleSimulateIncident}
                title="Stream an instant simulated telemetry incident to globe"
                className="px-2.5 py-1.5 rounded bg-slate-900/90 hover:bg-slate-800 text-slate-300 font-mono text-[11px] flex items-center gap-1.5 border border-slate-700/80 shadow-md backdrop-blur transition-colors"
              >
                <Zap className="w-3 h-3 text-amber-400" />
                <span>Simulate Incident</span>
              </button>

              <div className="px-2 py-1.5 rounded bg-slate-900/90 border border-slate-800 text-[10px] font-mono flex items-center gap-1.5 text-slate-300 shadow-md backdrop-blur">
                <span className={`w-2 h-2 rounded-full ${sseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                <span>{sseConnected ? 'LIVE FEED ACTIVE' : 'STREAM RECONNECTING'}</span>
              </div>
            </div>

            {/* Incoming Live Telemetry Alert Toast */}
            {incomingAlert && (
              <div className="absolute top-14 right-3 z-30 w-80 sm:w-96 p-3 rounded bg-[#0d1017]/95 border border-blue-900/60 shadow-2xl backdrop-blur animate-in fade-in slide-in-from-top-3 duration-300">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-blue-400 font-semibold">
                      Live Telemetry Ingested
                    </span>
                  </div>
                  <button
                    onClick={() => setIncomingAlert(null)}
                    className="text-slate-400 hover:text-slate-200 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="mt-1.5 flex items-baseline gap-2">
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                    incomingAlert.severity === 'CRITICAL' ? 'bg-red-950/70 text-red-300 border-red-800' :
                    incomingAlert.severity === 'HIGH' ? 'bg-amber-950/70 text-amber-300 border-amber-800' :
                    incomingAlert.severity === 'MEDIUM' ? 'bg-blue-950/70 text-blue-300 border-blue-800' :
                    'bg-slate-800 text-slate-300 border-slate-700'
                  }`}>
                    {incomingAlert.severity}
                  </span>
                  <h4 className="text-xs font-semibold text-slate-200 line-clamp-1 font-sans">
                    {incomingAlert.title}
                  </h4>
                </div>

                <p className="text-[11px] text-slate-400 font-sans mt-1 line-clamp-2 leading-relaxed">
                  {incomingAlert.description}
                </p>

                <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span className="flex items-center gap-1">
                    <Crosshair className="w-3 h-3 text-slate-500" />
                    {incomingAlert.latitude.toFixed(2)}°, {incomingAlert.longitude.toFixed(2)}°
                  </span>
                  <button
                    onClick={() => {
                      setSelectedEvent(incomingAlert);
                      setIncomingAlert(null);
                    }}
                    className="px-2 py-0.5 rounded bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-800 font-semibold transition-colors"
                  >
                    Focus on Globe →
                  </button>
                </div>
              </div>
            )}

            {/* Layer Control Panel */}
            <LayerControl
              layers={layers}
              onToggleLayer={handleToggleLayer}
              selectedSeverity={selectedSeverity}
              onSelectSeverity={setSelectedSeverity}
              counts={{
                cyber: events.filter((e) => e.metadata_json?.layer === 'cyber').length || 4,
                infrastructure: events.filter((e) => e.metadata_json?.layer === 'infrastructure').length || 3,
                earthquakes: events.filter((e) => e.metadata_json?.layer === 'earthquakes').length || 2,
                weather: events.filter((e) => e.metadata_json?.layer === 'weather').length || 1,
                maritime: events.filter((e) => e.metadata_json?.layer === 'maritime').length || 1,
                threat: events.filter((e) => e.metadata_json?.layer === 'threat').length || 2,
              }}
            />

            {/* Floating Defensive Advisor Trigger */}
            <button
              onClick={() => setIsAIOpen(true)}
              className="absolute bottom-4 right-4 z-10 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-100 font-mono text-xs font-semibold flex items-center gap-2 border border-slate-700 shadow-xl transition-colors"
            >
              <Bot className="w-3.5 h-3.5 text-blue-400" />
              <span>Defensive Advisor</span>
            </button>
          </div>

          {/* Bottom Event Timeline Scrubber */}
          <EventTimeline
            events={events}
            selectedEventId={selectedEvent?.id}
            onSelectEvent={(ev) => setSelectedEvent(ev)}
          />
        </div>

        {/* Right Flyout Intel Panel */}
        {selectedEvent && (
          <IntelPanel
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
            onAskAI={handleAskAI}
          />
        )}
      </div>

      {/* Defensive Advisor Flyout Modal */}
      <AIAssistantPanel
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        targetContext={selectedEvent?.title}
        initialQuery={aiInitialQuery}
      />
    </div>
  );
};
