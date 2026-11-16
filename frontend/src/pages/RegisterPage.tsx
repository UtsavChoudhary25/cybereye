import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, Mail, User as UserIcon, AlertTriangle, Eye, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please fill in all required fields');
      return;
    }

    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Password confirmation does not match');
      return;
    }

    if (!privacyAgreed) {
      setErrorMsg('Please acknowledge the privacy and defensive data collection policy');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await register(email, password, fullName);
      navigate('/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please check inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col justify-between bg-[#0a0c12] text-slate-100 font-sans select-none">
      <header className="h-14 border-b border-slate-800/80 px-6 flex items-center justify-between bg-[#0d0f17]">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded bg-slate-900 border border-slate-700 text-slate-200">
            <Eye className="w-4 h-4 text-blue-400" />
          </div>
          <span className="font-mono font-bold tracking-widest text-sm text-slate-100">
            CYBER<span className="text-blue-400">EYE</span>
          </span>
        </Link>
        <Link 
          to="/login"
          className="text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors"
        >
          Existing Analyst? Sign In
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md p-6 sm:p-8 rounded bg-[#10131d] border border-slate-800 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-950/60 border border-blue-800 text-blue-400 mb-2">
              <Shield className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-mono font-bold text-slate-100 tracking-wide">
              ANALYST REGISTRATION
            </h1>
            <p className="text-xs text-slate-400">
              Create a secure account with Argon2id protection and personal investigation scoping.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded bg-red-950/40 border border-red-900/80 text-red-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMsg}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>Analyst Name (Optional)</span>
              </label>
              <input
                type="text"
                placeholder="Alex Vance"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-[#0b0d14] border border-slate-800 rounded px-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Email Address</span>
              </label>
              <input
                type="email"
                required
                placeholder="analyst@defense.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0b0d14] border border-slate-800 rounded px-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Password (Min 8 Characters)</span>
              </label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0b0d14] border border-slate-800 rounded px-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Confirm Password</span>
              </label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[#0b0d14] border border-slate-800 rounded px-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="pt-1">
              <label className="flex items-start gap-2 cursor-pointer select-none text-[11px] text-slate-400">
                <input
                  type="checkbox"
                  checked={privacyAgreed}
                  onChange={(e) => setPrivacyAgreed(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0 mt-0.5 cursor-pointer"
                />
                <span>
                  I acknowledge the{' '}
                  <Link to="/privacy" target="_blank" className="text-blue-400 hover:underline">
                    Security & Privacy Policy
                  </Link>{' '}
                  and consent to defensive security audit logging.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-lg shadow-blue-900/30 mt-2"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Registering...' : 'Create Analyst Account'}</span>
            </button>
          </form>

          <div className="text-center pt-2 border-t border-slate-800/80 text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold">
              Sign In
            </Link>
          </div>
        </div>
      </main>

      <footer className="p-4 border-t border-slate-800/80 text-center text-[11px] font-mono text-slate-500">
        CyberEye Defense Command • Argon2id Key Derivation Standard
      </footer>
    </div>
  );
};
