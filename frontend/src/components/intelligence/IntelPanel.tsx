import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, MapPin, Radio, 
  ExternalLink, Bot, Crosshair, FileText 
} from 'lucide-react';
import { GlobalEvent } from '../../types';
import { Badge } from '../common/Badge';
import { formatLiveRelativeTime, formatExactUtcTime, useLiveTimer } from '../../utils/time';

interface IntelPanelProps {
  event: GlobalEvent | null;
  onClose: () => void;
  onAskAI: (query: string) => void;
}

export const IntelPanel: React.FC<IntelPanelProps> = ({
  event,
  onClose,
  onAskAI
}) => {
  const navigate = useNavigate();
  useLiveTimer(5000);

  if (!event) return null;

  return (
    <div className="w-80 md:w-96 bg-[#0e111a] border-l border-slate-800 h-full flex flex-col justify-between z-20 shadow-2xl">
      {/* Panel Header */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">
            INTELLIGENCE DOSSIER
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Panel Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs">
        {/* Title & Badges */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge severity={event.severity} />
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
              {event.type}
            </span>
          </div>
          <h3 className="text-sm font-bold text-slate-100 font-sans leading-snug">
            {event.title}
          </h3>
        </div>

        {/* Description */}
        <div className="p-3 rounded bg-[#121520] border border-slate-800/80 text-slate-300 font-sans leading-relaxed text-xs">
          {event.description}
        </div>

        {/* Telemetry Attributes */}
        <div className="space-y-2 border-t border-slate-800/80 pt-3">
          <div className="flex justify-between items-center text-slate-400">
            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> Coordinates</span>
            <span className="text-slate-200">{event.latitude.toFixed(4)}°, {event.longitude.toFixed(4)}°</span>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>Status</span>
            <span className="text-emerald-400 uppercase font-semibold">{event.status}</span>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>Reported Source</span>
            <span className="text-slate-200 truncate max-w-[180px]">{event.source}</span>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>Timing</span>
            <div className="text-right">
              <div className="text-emerald-400 font-semibold">{formatLiveRelativeTime(event.timestamp)}</div>
              <div className="text-[10px] text-slate-500 font-mono">{formatExactUtcTime(event.timestamp)}</div>
            </div>
          </div>
        </div>

        {/* Attack Trajectory / Layer Specific Metadata */}
        {event.metadata_json && Object.keys(event.metadata_json).length > 0 && (
          <div className="p-3 rounded bg-[#121520] border border-slate-800/80 space-y-2">
            <div className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">
              Layer Telemetry
            </div>
            {Object.entries(event.metadata_json).map(([k, v]) => (
              <div key={k} className="flex justify-between text-[11px]">
                <span className="text-slate-400 capitalize">{k.replace('_', ' ')}:</span>
                <span className="text-slate-200 font-semibold truncate max-w-[180px]">{String(v)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Automated Threat Briefing */}
        <div className="p-3 rounded bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center gap-1.5 text-slate-200 font-bold text-xs">
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            Automated Threat Briefing
          </div>
          <p className="text-[11px] font-sans text-slate-300">
            Obtain defensive risk correlation and recommended posture mitigation.
          </p>
          <button
            onClick={() => onAskAI(`Provide a defensive threat assessment for event: "${event.title}" - ${event.description}`)}
            className="w-full py-1.5 px-3 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 text-xs font-mono font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Bot className="w-3.5 h-3.5 text-blue-400" />
            Analyze Threat Indicators
          </button>
        </div>
      </div>

      {/* Footer Action Buttons */}
      <div className="p-3.5 border-t border-slate-800 space-y-2 bg-[#0c0e16]">
        <button
          onClick={() => navigate(`/investigate?target=${encodeURIComponent(event.title.split(' ')[0])}`)}
          className="w-full py-2 px-3 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-mono flex items-center justify-center gap-2 transition-colors"
        >
          <Crosshair className="w-3.5 h-3.5 text-blue-400" />
          Investigate Correlated Target
        </button>
        {event.source_url && (
          <a
            href={event.source_url}
            target="_blank"
            rel="noreferrer"
            className="w-full py-1 text-center text-[11px] font-mono text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1"
          >
            <span>Official Feed Source</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
};
