import React, { useState } from 'react';
import { 
  Play, Pause, Clock 
} from 'lucide-react';
import { GlobalEvent } from '../../types';
import { Badge } from '../common/Badge';
import { formatLiveRelativeTime, formatExactUtcTime, useLiveTimer } from '../../utils/time';

interface EventTimelineProps {
  events: GlobalEvent[];
  selectedEventId?: number;
  onSelectEvent: (event: GlobalEvent) => void;
}

export const EventTimeline: React.FC<EventTimelineProps> = ({
  events,
  selectedEventId,
  onSelectEvent
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [filterType, setFilterType] = useState<string>('ALL');

  useLiveTimer(5000);

  const filtered = events.filter((e) => {
    if (filterType === 'ALL') return true;
    return e.type.toLowerCase().includes(filterType.toLowerCase());
  });

  return (
    <div className="h-16 bg-[#0a0c12] border-t border-slate-800/80 px-4 py-1.5 flex items-center justify-between z-20 select-none">
      {/* Controls & Metrics */}
      <div className="flex items-center gap-3 pr-4 border-r border-slate-800 shrink-0">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-slate-100 transition-colors"
          title={isPlaying ? 'Pause timeline stream' : 'Auto-advance stream'}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>

        <div>
          <div className="text-[10px] font-mono text-slate-500 uppercase flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            TELEMETRY STREAM
          </div>
          <div className="text-xs font-mono font-bold text-slate-200">
            {filtered.length} INCIDENTS
          </div>
        </div>
      </div>

      {/* Horizontal Scrollable Timeline Items */}
      <div className="flex-1 overflow-x-auto px-3 flex items-center gap-2.5">
        {filtered.map((ev) => {
          const isSelected = ev.id === selectedEventId;
          const relTime = formatLiveRelativeTime(ev.timestamp);
          const exactTime = formatExactUtcTime(ev.timestamp);
          
          return (
            <div
              key={ev.id}
              onClick={() => onSelectEvent(ev)}
              title={`${ev.title} — ${exactTime}`}
              className={`shrink-0 flex items-center gap-2 px-2.5 py-1 rounded border cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-slate-800 border-slate-600'
                  : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="text-[10px] font-mono text-emerald-400 font-medium">
                {relTime}
              </div>
              <Badge severity={ev.severity} />
              <div className="max-w-[200px] truncate text-xs font-mono text-slate-200">
                {ev.title}
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter Quick Pills */}
      <div className="hidden xl:flex items-center gap-1 pl-4 border-l border-slate-800 shrink-0">
        {['ALL', 'Cyber', 'Infra', 'Natural'].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
              filterType === type 
                ? 'bg-slate-800 text-slate-100 font-semibold border border-slate-700' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {type}
          </button>
        ))}
      </div>
    </div>
  );
};
