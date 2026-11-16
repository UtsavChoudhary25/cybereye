import React from 'react';
import { Severity } from '../../types';

interface BadgeProps {
  severity?: Severity | string;
  text?: string;
  variant?: 'solid' | 'outline';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ 
  severity = 'LOW', 
  text, 
  variant = 'solid', 
  className = '' 
}) => {
  const sev = (severity || 'LOW').toUpperCase();
  const label = text || sev;

  const colorStyles: Record<string, { bg: string; text: string; border: string; dot: string }> = {
    CRITICAL: {
      bg: 'bg-red-950/40',
      text: 'text-red-300',
      border: 'border-red-900/70',
      dot: 'bg-red-500'
    },
    HIGH: {
      bg: 'bg-amber-950/40',
      text: 'text-amber-300',
      border: 'border-amber-900/70',
      dot: 'bg-amber-500'
    },
    MEDIUM: {
      bg: 'bg-blue-950/40',
      text: 'text-blue-300',
      border: 'border-blue-900/70',
      dot: 'bg-blue-500'
    },
    LOW: {
      bg: 'bg-emerald-950/40',
      text: 'text-emerald-300',
      border: 'border-emerald-900/70',
      dot: 'bg-emerald-500'
    },
    INFO: {
      bg: 'bg-slate-900',
      text: 'text-slate-300',
      border: 'border-slate-800',
      dot: 'bg-slate-400'
    }
  };

  const style = colorStyles[sev] || colorStyles.LOW;

  return (
    <span 
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium border ${style.bg} ${style.text} ${style.border} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {label}
    </span>
  );
};
