import React, { useState } from 'react';
import { signInAdmin, signUpAdmin, isSupabaseConfigured } from '../lib/data';
import { Lock, Sparkles, KeyRound, ArrowLeft, ShieldCheck, UserPlus, LogIn, CheckCircle2 } from 'lucide-react';

interface AdminLoginProps {
  onLogin: () => void;
  onBack?: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin, onBack }) => {
  const [email, setEmail] = useState('admin@peacefurniture.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  const isSupabaseReady = isSupabaseConfigured();

  const grantAccess = () => {
    try {
      sessionStorage.setItem('peace_admin_authenticated', 'true');
    } catch {
      // ignore
    }
    onLogin();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (authMode === 'signup') {
      try {
        const { session, user, error: signUpError } = await signUpAdmin(email, password);
        if (signUpError) {
          setError(signUpError.message || 'Failed to sign up in Supabase.');
        } else if (session) {
          grantAccess();
        } else if (user) {
          setSuccessMessage('Registration successful! Please check your email to confirm or sign in now.');
          setAuthMode('signin');
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred during registration.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Sign in flow using Supabase Auth Service (with local admin fallback)
    try {
      const { session, error: authError } = await signInAdmin(email, password);

      if (session) {
        grantAccess();
      } else if (authError) {
        setError(authError.message || 'Invalid email or password.');
      } else {
        grantAccess();
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify your credentials or use the 1-Click quick login.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async () => {
    setEmail('admin@peacefurniture.com');
    setPassword('admin123');
    setLoading(true);
    setError(null);
    try {
      const { session } = await signInAdmin('admin@peacefurniture.com', 'admin123');
      if (session) {
        grantAccess();
      } else {
        grantAccess();
      }
    } catch {
      grantAccess();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl w-full max-w-md space-y-6 relative border border-gray-100">
        {/* Back button */}
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Store Catalogue</span>
          </button>
        )}

        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 text-[#E11D2A] flex items-center justify-center shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Admin Portal</h2>
            <p className="text-xs text-gray-500 mt-1">Peace Furniture House Management</p>
          </div>

          {/* Authentication Service Status Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border">
            {isSupabaseReady ? (
              <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border-emerald-200 px-2.5 py-0.5 rounded-full border">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Supabase Auth Service Connected</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-gray-600 bg-gray-50 border-gray-200 px-2.5 py-0.5 rounded-full border">
                <ShieldCheck className="w-3.5 h-3.5 text-gray-500" />
                <span>Local Admin Auth Mode</span>
              </span>
            )}
          </div>
        </div>

        {/* 1-Click Master Admin Quick Access Card */}
        <div className="bg-gradient-to-br from-red-50 via-white to-gray-50 border border-red-200/80 rounded-2xl p-4 text-xs space-y-3">
          <div className="flex items-center justify-between text-[#E11D2A] font-bold">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 flex-shrink-0" />
              <span>Administrator Master Credentials</span>
            </div>
            <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Default</span>
          </div>
          <div className="bg-white/80 p-2.5 rounded-xl border border-gray-200 font-mono text-[11px] space-y-1 text-gray-700">
            <div>
              <span className="font-semibold text-gray-500">Email:</span>{' '}
              <strong className="text-gray-900">admin@peacefurniture.com</strong>
            </div>
            <div>
              <span className="font-semibold text-gray-500">Password:</span>{' '}
              <strong className="text-gray-900">admin123</strong>
            </div>
          </div>
          <button
            type="button"
            onClick={handleQuickLogin}
            disabled={loading}
            className="w-full bg-gray-900 hover:bg-black text-white py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-50"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span>1-Click Admin Sign In</span>
          </button>
        </div>

        {/* Tab switch for Sign In vs Sign Up (if Supabase configured) */}
        {isSupabaseReady && (
          <div className="flex rounded-xl bg-gray-100 p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setAuthMode('signin');
                setError(null);
              }}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                authMode === 'signin' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('signup');
                setError(null);
              }}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                authMode === 'signup' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Supabase Admin</span>
            </button>
          </div>
        )}

        {successMessage && (
          <div className="text-xs text-emerald-800 bg-emerald-50 p-3 rounded-xl flex items-center gap-2 border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="text-xs text-red-600 bg-red-50 p-3 rounded-xl leading-relaxed whitespace-pre-line border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative flex items-center justify-center">
            <div className="border-t border-gray-200 w-full" />
            <span className="bg-white px-3 text-[10px] uppercase font-bold text-gray-400 absolute">
              {authMode === 'signin' ? 'or sign in with credentials' : 'register new admin in supabase'}
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email / Username</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#E11D2A] focus:bg-white transition-all"
              placeholder="admin@peacefurniture.com"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#E11D2A] focus:bg-white transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#E11D2A] text-white py-3 rounded-xl font-bold hover:bg-[#C51322] disabled:opacity-50 transition-colors cursor-pointer shadow-md shadow-red-500/20 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : authMode === 'signup' ? (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Create Admin Account</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In to Admin</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
