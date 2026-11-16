import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Search, Clock, Eye, X, ExternalLink, User as UserIcon, 
  LogOut, ShieldAlert, KeyRound, Shield
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState({
    utc: '',
    local: ''
  });

  // Update real-time clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime({
        utc: now.toUTCString().slice(17, 25) + ' UTC',
        local: now.toLocaleTimeString([], { hour12: false }) + ' LOC'
      });
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Global search handler
  useEffect(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const fetchMatches = async () => {
      setIsSearching(true);
      try {
        const [events, vulns, assets] = await Promise.all([
          api.getEvents({ limit: 20 }),
          api.getVulnerabilities({ search: query, limit: 10 }),
          api.getAssets({ limit: 10 })
        ]);

        const matches: any[] = [];

        // Check if query looks like target to investigate
        if (query.includes('.') || query.length >= 3) {
          matches.push({
            type: 'ACTION',
            title: `Investigate target "${searchQuery}"`,
            subtitle: 'Run passive OSINT & relationship correlation',
            action: () => navigate(`/investigate?target=${encodeURIComponent(searchQuery)}`)
          });
        }

        // Matching events
        events
          .filter(e => e.title.toLowerCase().includes(query) || e.type.toLowerCase().includes(query))
          .slice(0, 3)
          .forEach(e => {
            matches.push({
              type: 'EVENT',
              title: e.title,
              subtitle: `${e.type} • ${e.severity}`,
              action: () => navigate(`/events`)
            });
          });

        // Matching CVEs
        vulns.forEach(v => {
          matches.push({
            type: 'CVE',
            title: `${v.cve_id} (${v.cvss})`,
            subtitle: v.title,
            action: () => navigate(`/vulnerabilities`)
          });
        });

        // Matching Assets
        assets
          .filter(a => a.ip?.includes(query) || a.hostname?.toLowerCase().includes(query) || a.organization?.toLowerCase().includes(query))
          .forEach(a => {
            matches.push({
              type: 'ASSET',
              title: a.hostname || a.ip || a.organization,
              subtitle: `${a.country || 'Global'} • ${a.asn || 'ASN'}`,
              action: () => navigate(`/assets`)
            });
          });

        setSearchResults(matches);
        setShowDropdown(true);
      } catch (err) {
        console.error('Search query failed', err);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(fetchMatches, 250);
    return () => clearTimeout(debounce);
  }, [searchQuery, navigate]);

  return (
    <header className="h-14 bg-[#0d0f17] border-b border-slate-800/80 px-4 flex items-center justify-between z-30 sticky top-0">
      {/* Brand Identity */}
      <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => navigate('/')}>
        <div className="flex items-center justify-center w-8 h-8 rounded bg-slate-900 border border-slate-700 text-slate-200">
          <Eye className="w-4 h-4 text-blue-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold tracking-widest text-sm text-slate-100 flex items-center">
              CYBER<span className="text-blue-400">EYE</span>
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
              DEFENSE SOC
            </span>
          </div>
          <p className="text-[10px] font-mono text-slate-400 hidden sm:block">
            Intelligence Telemetry & Correlation
          </p>
        </div>
      </div>

      {/* Global Command Center Search */}
      <div className="relative w-72 md:w-80 lg:w-96 max-w-md hidden sm:block">
        <div className="relative flex items-center">
          <Search className="absolute left-3 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search domain, IP, ASN, CVE, organization..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery && setShowDropdown(true)}
            className="w-full bg-[#11141e] border border-slate-800 rounded pl-8 pr-7 py-1.5 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-600 transition-colors"
          />
          {searchQuery && (
            <button 
              onClick={() => { setSearchQuery(''); setShowDropdown(false); }}
              className="absolute right-2 text-slate-400 hover:text-slate-200 p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Global Search Dropdown */}
        {showDropdown && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 matte-panel rounded shadow-xl overflow-hidden z-50">
            <div className="p-1.5 text-[10px] font-mono uppercase text-slate-400 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
              <span>Telemetry Matches</span>
              <span className="text-slate-400">{searchResults.length} items</span>
            </div>
            <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/80">
              {searchResults.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    item.action();
                    setShowDropdown(false);
                    setSearchQuery('');
                  }}
                  className="p-2.5 hover:bg-slate-800/50 cursor-pointer transition-colors flex items-center justify-between group"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                        item.type === 'ACTION' ? 'bg-blue-950/60 text-blue-300 border-blue-800' :
                        item.type === 'CVE' ? 'bg-red-950/60 text-red-300 border-red-800' :
                        item.type === 'EVENT' ? 'bg-amber-950/60 text-amber-300 border-amber-800' :
                        'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {item.type}
                      </span>
                      <span className="text-xs font-mono text-slate-200 group-hover:text-blue-400">
                        {item.title}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-sans mt-0.5 ml-8">
                      {item.subtitle}
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Controls: Clocks, Privacy, and Authentication */}
      <div className="flex items-center gap-2.5">
        {/* Real-time Clock */}
        <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{currentTime.utc}</span>
        </div>

        {/* Privacy Link */}
        <Link 
          to="/privacy" 
          title="Privacy Policy & Security Telemetry Notice"
          className="hidden md:flex items-center gap-1 px-2 py-1 rounded bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-[11px] font-mono text-slate-400 hover:text-slate-200 transition-colors"
        >
          <Shield className="w-3 h-3 text-slate-400" />
          <span>Privacy</span>
        </Link>

        {/* Authentication Controls */}
        {isAuthenticated && user ? (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors text-xs font-mono"
            >
              <div className="w-5 h-5 rounded-full bg-blue-950 border border-blue-700 text-blue-300 flex items-center justify-center font-bold text-[10px]">
                {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
              </div>
              <span className="hidden md:inline text-slate-200 max-w-[120px] truncate">
                {user.full_name || user.email.split('@')[0]}
              </span>
              <span className={`text-[9px] px-1 py-0.2 rounded border font-mono ${
                user.role === 'admin' 
                  ? 'bg-amber-950/60 text-amber-300 border-amber-800' 
                  : 'bg-blue-950/40 text-blue-300 border-blue-800/60'
              }`}>
                {user.role.toUpperCase()}
              </span>
            </button>

            {/* User Dropdown */}
            {showUserMenu && (
              <div 
                className="absolute right-0 mt-1.5 w-56 matte-panel rounded border border-slate-800 shadow-xl overflow-hidden z-50 divide-y divide-slate-800/80 font-mono text-xs"
                onMouseLeave={() => setShowUserMenu(false)}
              >
                <div className="p-3 bg-slate-900/90">
                  <div className="font-bold text-slate-100 truncate">{user.full_name || 'CyberEye Operator'}</div>
                  <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
                  <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-500">
                    <span>Role: <strong className="text-slate-300">{user.role}</strong></span>
                    <span>•</span>
                    <span>Argon2id auth</span>
                  </div>
                </div>

                <div className="p-1 space-y-0.5">
                  {user.role === 'admin' && (
                    <button
                      onClick={() => { setShowUserMenu(false); navigate('/admin'); }}
                      className="w-full text-left px-2.5 py-2 hover:bg-slate-800/60 rounded flex items-center gap-2 text-amber-300"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Security Audit Admin</span>
                    </button>
                  )}
                  <button
                    onClick={() => { setShowUserMenu(false); navigate('/settings'); }}
                    className="w-full text-left px-2.5 py-2 hover:bg-slate-800/60 rounded flex items-center gap-2 text-slate-300"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                    <span>Account Security</span>
                  </button>
                  <button
                    onClick={() => { setShowUserMenu(false); navigate('/privacy'); }}
                    className="w-full text-left px-2.5 py-2 hover:bg-slate-800/60 rounded flex items-center gap-2 text-slate-300"
                  >
                    <Shield className="w-3.5 h-3.5 text-slate-400" />
                    <span>Privacy Policy</span>
                  </button>
                </div>

                <div className="p-1">
                  <button
                    onClick={() => { setShowUserMenu(false); logout(); }}
                    className="w-full text-left px-2.5 py-2 hover:bg-red-950/40 text-red-300 rounded flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Revoke Session (Logout)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className="hidden lg:inline text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
              DEMO ACCESS
            </span>
            <Link
              to="/login"
              className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors flex items-center gap-1 text-[11px]"
            >
              <UserIcon className="w-3 h-3" />
              <span>Sign In</span>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

