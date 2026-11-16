import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, SearchCheck, Server, Share2, 
  ShieldAlert, ShieldCheck, Globe, Binary, FileText, Database, 
  Settings, Activity, ShieldCheck as AdminShield, Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  adminOnly?: boolean;
}

const baseNavItems: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Investigate', path: '/investigate', icon: SearchCheck },
  { name: 'Assets', path: '/assets', icon: Server, badge: '14' },
  { name: 'Threat Graph', path: '/threat-graph', icon: Share2 },
  { name: 'Vulnerabilities', path: '/vulnerabilities', icon: ShieldAlert, badge: '31' },
  { name: 'Web Scanner', path: '/scanner', icon: ShieldCheck, badge: 'AUDIT' },
  { name: 'Global Events', path: '/events', icon: Globe, badge: 'LIVE' },
  { name: 'Intelligence', path: '/intelligence', icon: Binary },
  { name: 'Reports', path: '/reports', icon: FileText },
  { name: 'Data Sources', path: '/datasources', icon: Database },
  { name: 'Security Audit', path: '/admin', icon: AdminShield, badge: 'ADMIN', adminOnly: true },
  { name: 'Settings', path: '/settings', icon: Settings },
  { name: 'Privacy Notice', path: '/privacy', icon: Shield },
];

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const visibleItems = baseNavItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <aside className="w-56 bg-[#0c0e16] border-r border-slate-800/80 flex flex-col justify-between select-none z-20">
      <div className="py-3 px-2 space-y-1">
        <div className="px-3 py-1 mb-2">
          <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase flex items-center gap-1.5">
            <Activity className="w-3 h-3 text-slate-400" />
            Operations Command
          </span>
        </div>

        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded text-xs font-mono transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-slate-100 font-semibold border-l-2 border-blue-500 pl-2.5'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`
              }
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${item.adminOnly ? 'text-amber-400' : 'text-slate-400'}`} />
                <span className={item.adminOnly ? 'text-amber-300 font-semibold' : ''}>{item.name}</span>
              </div>
              {item.badge && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono border ${
                  item.badge === 'LIVE' 
                    ? 'bg-red-950/40 text-red-400 border-red-900/60' 
                    : item.badge === 'ADMIN'
                    ? 'bg-amber-950/60 text-amber-300 border-amber-800'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}>
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Sidebar Footer Indicator */}
      <div className="p-3 border-t border-slate-800/80 bg-[#090b10]">
        <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
          <span className="text-slate-500">DEFENSE POSTURE</span>
          <span className="text-slate-300 font-semibold">TIER 1 WATCH</span>
        </div>
        <div className="mt-1.5 w-full bg-slate-900 rounded-full h-1 overflow-hidden">
          <div className="bg-blue-500 h-full w-3/4" />
        </div>
        <div className="mt-2 text-[10px] text-slate-500 font-sans">
          Defensive OSINT Framework
        </div>
      </div>
    </aside>
  );
};

