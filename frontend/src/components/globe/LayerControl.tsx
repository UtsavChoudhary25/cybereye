import React from 'react';
import { 
  ShieldAlert, Server, Activity, CloudRain, 
  Ship, Radio, Eye, Filter 
} from 'lucide-react';

export interface LayerState {
  cyber: boolean;
  infrastructure: boolean;
  earthquakes: boolean;
  weather: boolean;
  transport: boolean;
  maritime: boolean;
  threat: boolean;
}

interface LayerControlProps {
  layers: LayerState;
  onToggleLayer: (layer: keyof LayerState) => void;
  selectedSeverity: string;
  onSelectSeverity: (sev: string) => void;
  counts: Record<string, number>;
}

export const LayerControl: React.FC<LayerControlProps> = ({
  layers,
  onToggleLayer,
  selectedSeverity,
  onSelectSeverity,
  counts
}) => {
  const layerDefs = [
    { key: 'cyber' as const, label: 'Cyber Incidents', icon: ShieldAlert, color: 'text-red-400', count: counts.cyber || 4 },
    { key: 'infrastructure' as const, label: 'Infrastructure & Fiber', icon: Server, color: 'text-blue-400', count: counts.infrastructure || 3 },
    { key: 'earthquakes' as const, label: 'Earthquakes (USGS)', icon: Activity, color: 'text-amber-400', count: counts.earthquakes || 2 },
    { key: 'weather' as const, label: 'Weather Telemetry', icon: CloudRain, color: 'text-slate-300', count: counts.weather || 1 },
    { key: 'maritime' as const, label: 'Maritime & Port Transit', icon: Ship, color: 'text-emerald-400', count: counts.maritime || 1 },
    { key: 'threat' as const, label: 'Threat Intelligence / IOC', icon: Radio, color: 'text-slate-400', count: counts.threat || 2 },
  ];


  return (
    <div className="absolute top-4 left-4 z-20 matte-panel rounded p-3 w-64 shadow-xl text-slate-200">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <span className="text-xs font-mono font-semibold tracking-wider text-slate-200 flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5 text-blue-400" />
          ACTIVE SENSORS
        </span>
        <span className="text-[10px] font-mono text-slate-400">GEO-FILTER</span>
      </div>

      {/* Layer Toggles */}
      <div className="mt-2.5 space-y-1.5">
        {layerDefs.map((layer) => {
          const Icon = layer.icon;
          const active = layers[layer.key];
          return (
            <button
              key={layer.key}
              onClick={() => onToggleLayer(layer.key)}
              className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-xs font-mono transition-colors ${
                active 
                  ? 'bg-slate-800/80 border border-slate-700 text-slate-200' 
                  : 'bg-slate-900/30 border border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => {}} // handled by button
                  className="rounded bg-slate-950 border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
                />
                <Icon className={`w-3.5 h-3.5 ${layer.color}`} />
                <span>{layer.label}</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                {layer.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Severity Filter */}
      <div className="mt-3 pt-2.5 border-t border-slate-800">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5">
          <span className="flex items-center gap-1">
            <Filter className="w-3 h-3 text-slate-400" /> Severity:
          </span>
          {selectedSeverity && (
            <button 
              onClick={() => onSelectSeverity('')}
              className="text-[10px] text-blue-400 hover:underline"
            >
              Reset
            </button>
          )}
        </div>
        <div className="grid grid-cols-4 gap-1">
          {[
            { id: 'CRITICAL', label: 'CRIT', color: 'bg-red-950/50 text-red-400 border-red-900/80' },
            { id: 'HIGH', label: 'HIGH', color: 'bg-amber-950/50 text-amber-400 border-amber-900/80' },
            { id: 'MEDIUM', label: 'MED', color: 'bg-blue-950/50 text-blue-400 border-blue-900/80' },
            { id: 'LOW', label: 'LOW', color: 'bg-emerald-950/50 text-emerald-400 border-emerald-900/80' },
          ].map((sev) => {
            const isSelected = selectedSeverity === sev.id;
            return (
              <button
                key={sev.id}
                onClick={() => onSelectSeverity(isSelected ? '' : sev.id)}
                className={`text-[10px] font-mono py-1 rounded border transition-colors ${
                  isSelected 
                    ? `${sev.color} font-bold ring-1 ring-slate-400` 
                    : 'bg-slate-900/60 border-slate-800 text-slate-500 hover:text-slate-300'
                }`}
              >
                {sev.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
