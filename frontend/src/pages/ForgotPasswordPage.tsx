import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, KeyRound, Mail, AlertTriangle, CheckCircle2, ArrowLeft, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Step 2: Confirmation with reset token
  const [hasToken, setHasToken] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    setErrorMsg('');
    setStatusMessage('');
    try {
      const res = await api.resetPasswordRequest(email);
      setStatusMessage(res.message);
      if (res.demo_reset_token) {
        setResetToken(res.demo_reset_token);
        setHasToken(true);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Password reset request failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken || !newPassword) return;

    if (newPassword.length < 8) {
      setErrorMsg('New password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMsg('Password confirmation does not match');
      return;
    }

    setIsResetting(true);
    setErrorMsg('');
    try {
      const res = await api.resetPasswordConfirm({
        token: resetToken,
        new_password: newPassword
      });
      setResetSuccess(true);
      setStatusMessage(res.message);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reset password. Token may be expired or already used.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col justify-between bg-[#0a0c12] text-slate-100 font-sans select-none">
      <header className="h-14 border-b border-slate-800/80 px-6 flex items-center justify-between bg-[#0d0f17]">
        <Link to="/" className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-blue-400" />
          <span className="font-mono font-bold tracking-widest text-sm text-slate-100">
            CYBER<span className="text-blue-400">EYE</span>
          </span>
        </Link>
        <Link 
          to="/login"
          className="text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sign In</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md p-6 sm:p-8 rounded bg-[#10131d] border border-slate-800 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-950/60 border border-blue-800 text-blue-400 mb-2">
              <KeyRound className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-mono font-bold text-slate-100 tracking-wide">
              CREDENTIAL RECOVERY
            </h1>
            <p className="text-xs text-slate-400">
              Recover access through verified cryptographic token issuance.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded bg-red-950/40 border border-red-900/80 text-red-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {statusMessage && (
            <div className="p-3 rounded bg-emerald-950/40 border border-emerald-900/80 text-emerald-300 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{statusMessage}</div>
            </div>
          )}

          {resetSuccess ? (
            <div className="text-center space-y-4 pt-2">
              <p className="text-xs text-slate-300">
                Your password has been successfully updated. All active sessions have been revoked for your security.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-semibold"
              >
                Sign In with New Password
              </Link>
            </div>
          ) : !hasToken ? (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Account Email</span>
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

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Dispatched Verification...</span>
                  </>
                ) : (
                  <span>Request Password Reset</span>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setHasToken(true)}
                  className="text-xs font-mono text-slate-400 hover:text-slate-200 underline"
                >
                  Already have a reset token? Enter it here
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleConfirmReset} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-300">Reset Token</label>
                <input
                  type="text"
                  required
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  placeholder="Paste your 32-character token"
                  className="w-full bg-[#0b0d14] border border-slate-800 rounded px-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-300">New Password (Min 8 Chars)</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#0b0d14] border border-slate-800 rounded px-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-300">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#0b0d14] border border-slate-800 rounded px-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={isResetting}
                className="w-full py-2.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {isResetting ? 'Applying New Password...' : 'Confirm Password Reset'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setHasToken(false)}
                  className="text-xs font-mono text-slate-400 hover:text-slate-200"
                >
                  ← Request a different token
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      <footer className="p-4 border-t border-slate-800/80 text-center text-[11px] font-mono text-slate-500">
        CyberEye Defense Command • High-entropy SHA-256 Token Verification
      </footer>
    </div>
  );
};
