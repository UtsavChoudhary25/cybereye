import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'cyan' | 'rose' | 'amber' | 'emerald' | 'purple' | 'blue';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subValue,
  icon: Icon,
  color = 'blue',
  onClick
}) => {
  const iconColorMap = {
    cyan: 'text-blue-400',
    blue: 'text-blue-400',
    rose: 'text-red-400',
    amber: 'text-amber-400',
    emerald: 'text-emerald-400',
    purple: 'text-slate-300',
  };

  return (
    <div 
      onClick={onClick}
      className={`matte-card p-3 rounded border border-slate-800/90 transition-colors ${
        onClick ? 'cursor-pointer hover:border-slate-700' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">{label}</span>
        <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
          <Icon className={`w-3.5 h-3.5 ${iconColorMap[color] || 'text-slate-300'}`} />
        </div>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-xl font-bold font-mono text-slate-100">{value}</span>
        {subValue && (
          <span className="text-[11px] font-mono text-slate-400">{subValue}</span>
        )}
      </div>
    </div>
  );
};
