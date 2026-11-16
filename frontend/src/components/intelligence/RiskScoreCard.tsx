import React from 'react';
import { Shield, Info } from 'lucide-react';
import { RiskAssessment } from '../../types';

interface RiskScoreCardProps {
  assessment: RiskAssessment | null;
}

export const RiskScoreCard: React.FC<RiskScoreCardProps> = ({ assessment }) => {
  if (!assessment) return null;

  const { score, level, formula_label, breakdown, summary, target } = assessment;

  const colorConfig = {
    CRITICAL: { text: 'text-red-400', border: 'border-red-900/80', bg: 'bg-red-950/40', stroke: '#dc2626' },
    HIGH: { text: 'text-amber-400', border: 'border-amber-900/80', bg: 'bg-amber-950/40', stroke: '#d97706' },
    MEDIUM: { text: 'text-blue-400', border: 'border-blue-900/80', bg: 'bg-blue-950/40', stroke: '#3b82f6' },
    LOW: { text: 'text-emerald-400', border: 'border-emerald-900/80', bg: 'bg-emerald-950/40', stroke: '#16a34a' },
  }[level] || { text: 'text-blue-400', border: 'border-blue-900/80', bg: 'bg-blue-950/40', stroke: '#3b82f6' };

  return (
    <div className={`matte-panel p-4 rounded border ${colorConfig.border}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Shield className={`w-4 h-4 ${colorConfig.text}`} />
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400">
              HEURISTIC THREAT ASSESSMENT
            </h3>
            <span className="text-sm font-bold font-mono text-slate-100">{target}</span>
          </div>
        </div>
        <div className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${colorConfig.bg} ${colorConfig.text} ${colorConfig.border}`}>
          {level} RISK
        </div>
      </div>

      {/* Main Score Readout */}
      <div className="mt-4 flex items-center gap-5">
        {/* Score Ring */}
        <div className="relative flex items-center justify-center w-20 h-20 shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-slate-800"
              strokeWidth="3.5"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              stroke={colorConfig.stroke}
              strokeDasharray={`${score}, 100`}
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-xl font-bold font-mono text-slate-100">{score}</span>
            <span className="text-[9px] font-mono text-slate-500">/ 100</span>
          </div>
        </div>

        {/* Heuristic Summary */}
        <div className="space-y-1.5 font-sans">
          <p className="text-xs text-slate-300 leading-relaxed">
            {summary}
          </p>
          <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
            <Info className="w-3 h-3 text-slate-400" />
            {formula_label}
          </div>
        </div>
      </div>

      {/* Transparent Points Breakdown */}
      <div className="mt-4 space-y-2 pt-3 border-t border-slate-800">
        <span className="text-[11px] font-mono uppercase text-slate-400 font-bold block mb-2">
          Calculated Scoring Factors
        </span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {breakdown.map((item, idx) => (
            <div key={idx} className="p-2.5 rounded bg-slate-900/80 border border-slate-800 flex items-start justify-between gap-2">
              <div>
                <div className="text-xs font-mono font-bold text-slate-200">
                  {item.name}
                </div>
                <div className="text-[11px] text-slate-400 font-sans mt-0.5">
                  {item.description}
                </div>
                <span className="text-[9px] font-mono text-slate-500 uppercase mt-1 inline-block">
                  {item.category}
                </span>
              </div>
              <span className={`text-xs font-mono font-bold shrink-0 px-1.5 py-0.5 rounded border ${
                item.points >= 20 ? 'bg-red-950/40 text-red-400 border-red-900/60' :
                item.points >= 10 ? 'bg-amber-950/40 text-amber-400 border-amber-900/60' :
                'bg-blue-950/40 text-blue-400 border-blue-900/60'
              }`}>
                +{item.points}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
