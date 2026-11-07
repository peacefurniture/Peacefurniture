import React, { useState } from 'react';
import { signInAdmin, isSupabaseConfigured, getSupabaseUrl } from '../lib/data';
import { Lock, ArrowLeft, ShieldCheck, LogIn, AlertCircle, Database, Settings } from 'lucide-react';
import { SupabaseConfigModal } from './SupabaseConfigModal';

interface AdminLoginProps {
  onLogin: () => void;
  onBack?: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);

  const isConfigured = isSupabaseConfigured();
  const currentSupabaseUrl = getSupabaseUrl();

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

    if (!isConfigured) {
      setError('Supabase is not configured yet. Please click "Configure Supabase" below to enter your Supabase Project URL and Anon Key.');
      setLoading(false);
      return;
    }

    // Direct Supabase Authentication
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
      setError(err.message || 'Supabase authentication failed. Please check your credentials.');
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
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Admin Portal</h2>
            <p className="text-xs text-gray-500 mt-1">Supabase Authentication Sign In</p>
          </div>

          {/* Connection Status Badge */}
          {isConfigured ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Supabase Connected</span>
              {currentSupabaseUrl && (
                <span className="text-[10px] text-emerald-600 font-mono hidden xs:inline">
                  ({currentSupabaseUrl.replace(/^https?:\/\//, '').split('.')[0]})
                </span>
              )}
            </div>
          ) : (
            <div className="w-full bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-left text-xs space-y-2">
              <div className="flex items-center gap-2 text-amber-800 font-bold">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Supabase Not Configured</span>
              </div>
              <p className="text-amber-700 text-[11px] leading-relaxed">
                Connect your Supabase project URL & Anon Key to authenticate users against Supabase Auth.
              </p>
              <button
                type="button"
                onClick={() => setIsDbModalOpen(true)}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-xs"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Configure Supabase Credentials</span>
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="text-xs text-red-600 bg-red-50 p-3 rounded-xl leading-relaxed whitespace-pre-line border border-red-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Supabase Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#E11D2A] focus:bg-white transition-all text-gray-900 placeholder-gray-400"
              placeholder="user@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#E11D2A] focus:bg-white transition-all text-gray-900 placeholder-gray-400"
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
              <span>Authenticating with Supabase...</span>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In with Supabase</span>
              </>
            )}
          </button>
        </form>

        {/* Footer info & Database Configuration link */}
        <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
          <span>Protected with Supabase Auth</span>
          <button
            type="button"
            onClick={() => setIsDbModalOpen(true)}
            className="text-gray-600 hover:text-gray-900 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Database className="w-3 h-3 text-emerald-600" />
            <span>Connection Settings</span>
          </button>
        </div>
      </div>

      {/* Supabase Connection Config Modal */}
      <SupabaseConfigModal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
        onSaved={() => {
          setIsDbModalOpen(false);
          setError(null);
        }}
      />
    </div>
  );
};
