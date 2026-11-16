import React, { useState, useEffect } from 'react';
import { 
  Globe, Search, MapPin, RefreshCw, Zap, Radio, Clock
} from 'lucide-react';
import { Header } from '../components/common/Header';
import { Sidebar } from '../components/common/Sidebar';
import { Badge } from '../components/common/Badge';
import { api } from '../services/api';
import { GlobalEvent } from '../types';
import { 
  formatLiveRelativeTime, 
  formatExactUtcTime, 
  isRecentEvent, 
  useLiveTimer 
} from '../utils/time';

export const GlobalEventsPage: React.FC = () => {
  const [events, setEvents] = useState<GlobalEvent[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('');
  const [sseConnected, setSseConnected] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [latestEventId, setLatestEventId] = useState<number | undefined>(undefined);

  // Hook causes relative times to re-evaluate every 5 seconds dynamically
  useLiveTimer(5000);

  const fetchEvents = async () => {
    try {
      const res = await api.getEvents({
        event_type: selectedType || undefined,
        severity: selectedSeverity || undefined,
        limit: 100,
      });
      setEvents(res);
    } catch (err) {
      console.error('Failed to load events', err);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [selectedType, selectedSeverity]);

  // Real-Time Server-Sent Events (SSE) Live Stream Connection
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
      await fetchEvents();
    } catch (err) {
      console.error('Manual feed sync failed', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSimulateIncident = async () => {
    setIsSimulating(true);
    try {
      const inc = await api.simulateIncident();
      if (inc && inc.id) {
        setLatestEventId(inc.id);
        setEvents((prev) => {
          if (prev.some((e) => e.id === inc.id)) return prev;
          return [inc, ...prev];
        });
      }
    } catch (err) {
      console.error('Incident simulation failed', err);
    } finally {
      setIsSimulating(false);
    }
  };

  const filtered = events.filter((e) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      e.title.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.source.toLowerCase().includes(q)
    );
  });

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0a0c12] text-slate-100 overflow-hidden font-sans select-none">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
          {/* Header & Live Stream Status */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-base font-mono font-bold text-slate-100 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-400" />
                  GLOBAL CYBERSECURITY & GEOSPATIAL EVENT TELEMETRY
                </h2>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono">
                  <span className={`w-2 h-2 rounded-full ${sseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
                  <span className={sseConnected ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>
                    {sseConnected ? 'LIVE FEED ACTIVE' : 'STREAM RECONNECTING'}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-400 font-sans mt-1">
                Real-time incident stream correlating volumetric DDoS attacks, ransomware exfiltration, fiber anomalies, and seismic sensors.
              </p>
            </div>

            {/* Top Quick Actions: Sync & Simulate */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                title="Synchronize live USGS and CISA feeds now"
                className="px-2.5 py-1.5 rounded bg-slate-900/90 hover:bg-slate-800 text-slate-300 font-mono text-[11px] flex items-center gap-1.5 border border-slate-700/80 shadow-md backdrop-blur transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 text-blue-400 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Real Feeds'}</span>
              </button>

              <button
                onClick={handleSimulateIncident}
                disabled={isSimulating}
                title="Inject a real-time synthetic cyber telemetry incident"
                className="px-2.5 py-1.5 rounded bg-slate-900/90 hover:bg-slate-800 text-slate-300 font-mono text-[11px] flex items-center gap-1.5 border border-slate-700/80 shadow-md backdrop-blur transition-colors disabled:opacity-50"
              >
                <Zap className="w-3 h-3 text-amber-400" />
                <span>Simulate Live Incident</span>
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0d0f17]/90 p-3 rounded border border-slate-800">
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter incidents by target, city, vector..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#0a0c12] border border-slate-800 rounded pl-8 pr-3 py-1.5 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-600"
                />
              </div>

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-[#0a0c12] border border-slate-800 rounded px-3 py-1.5 text-xs font-mono text-slate-300 focus:outline-none focus:border-slate-600"
              >
                <option value="">All Event Types</option>
                <option value="Cybersecurity">Cybersecurity</option>
                <option value="Infrastructure">Infrastructure</option>
                <option value="Natural event">Natural Events</option>
                <option value="Vulnerability">Vulnerability</option>
              </select>

              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="bg-[#0a0c12] border border-slate-800 rounded px-3 py-1.5 text-xs font-mono text-slate-300 focus:outline-none focus:border-slate-600"
              >
                <option value="">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              <span>Displaying <strong>{filtered.length}</strong> events</span>
            </div>
          </div>

          {/* Events List */}
          <div className="space-y-3">
            {filtered.map((ev) => {
              const isRecent = isRecentEvent(ev.timestamp, 300); // within 5 minutes
              const isNewlyStreamed = ev.id === latestEventId;

              return (
                <div
                  key={ev.id}
                  className={`matte-card p-4 rounded border font-mono text-xs space-y-2.5 transition-all duration-300 ${
                    isNewlyStreamed
                      ? 'border-blue-500 bg-blue-950/20 shadow-lg shadow-blue-950/50 ring-1 ring-blue-500/40'
                      : isRecent
                      ? 'border-slate-700/80 bg-[#0e111a]'
                      : 'border-slate-800 bg-[#0d0f17]'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <Badge severity={ev.severity} />
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                        {ev.type}
                      </span>

                      {/* Live Dynamic Relative Timing Pill */}
                      <span 
                        className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded flex items-center gap-1.5 ${
                          isRecent
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80'
                            : 'bg-slate-900 border border-slate-800 text-slate-400'
                        }`}
                        title={`Exact Ingestion: ${formatExactUtcTime(ev.timestamp)}`}
                      >
                        {isRecent && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                        )}
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{formatLiveRelativeTime(ev.timestamp)}</span>
                      </span>

                      {/* Exact UTC Timestamp with Seconds */}
                      <span 
                        className="text-slate-500 text-[11px] font-mono hidden md:inline" 
                        title="Authoritative UTC Record"
                      >
                        {formatExactUtcTime(ev.timestamp)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isNewlyStreamed && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/80 text-blue-200 border border-blue-700 font-bold uppercase tracking-wider animate-pulse">
                          STREAMED LIVE
                        </span>
                      )}
                      <span className="text-[10px] text-emerald-400 uppercase font-semibold">
                        {ev.status}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-xs font-sans font-bold text-slate-100 leading-snug">
                    {ev.title}
                  </h3>

                  <p className="text-xs text-slate-300 font-sans leading-relaxed">
                    {ev.description}
                  </p>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {ev.latitude.toFixed(2)}°, {ev.longitude.toFixed(2)}°
                      </span>
                      <span>Source: <strong className="text-slate-300">{ev.source}</strong></span>
                    </div>

                    {ev.is_demo && (
                      <span className="text-[10px] text-amber-400 font-mono">
                        DEMO TELEMETRY
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
