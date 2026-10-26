import React, { useState, useEffect } from 'react';
import { Database, CheckCircle2, AlertCircle, X, ExternalLink, Key, Link2, ShieldCheck, RefreshCw } from 'lucide-react';
import {
  getSupabaseUrl,
  getSupabaseAnonKey,
  saveSupabaseCredentials,
  isSupabaseConfigured,
  runDatabaseHealthCheck,
} from '../lib/data';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  onConnected,
}) => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setUrl(getSupabaseUrl());
      setAnonKey(getSupabaseAnonKey());
      setTestStatus(isSupabaseConfigured() ? 'success' : 'idle');
      setErrorMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestAndSave = async () => {
    const cleanUrl = url.trim();
    const cleanKey = anonKey.trim();

    if (!cleanUrl || !cleanUrl.startsWith('https://')) {
      setTestStatus('error');
      setErrorMessage('Please enter a valid Supabase Project URL starting with https://');
      return;
    }

    if (!cleanKey || cleanKey.length < 20) {
      setTestStatus('error');
      setErrorMessage('Please enter a valid Supabase Anon Public Key');
      return;
    }

    setIsTesting(true);
    setTestStatus('idle');
    setErrorMessage('');

    try {
      saveSupabaseCredentials(cleanUrl, cleanKey);

      // Run live health check against Supabase instance
      const res = await runDatabaseHealthCheck();

      if (res.isConfigured) {
        setTestStatus('success');
        onConnected();
      } else {
        setTestStatus('error');
        const firstFail = res.checks.find((c) => c.status === 'fail');
        setErrorMessage(firstFail?.message || 'Connected to Supabase URL, but database schema tables (groups/items) need to be initialized with schema.sql.');
      }
    } catch (err: any) {
      setTestStatus('error');
      setErrorMessage(err.message || 'Could not connect to Supabase database. Please check URL and Anon Key.');
    } finally {
      setIsTesting(false);
    }
  };

  const handleClearCredentials = () => {
    saveSupabaseCredentials('', '');
    setUrl('');
    setAnonKey('');
    setTestStatus('idle');
    setErrorMessage('Cleared custom Supabase credentials.');
  };

  return (
    <div className="fixed inset-[#0000] z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 my-8">
        {/* Header */}
        <div className="bg-[#0F1115] text-white p-5 flex items-center justify-between border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">Connect Supabase Database</h3>
              <p className="text-xs text-gray-400">Enter your live Supabase credentials to sync data</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {/* Status Alert */}
          {testStatus === 'success' && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3.5 rounded-xl text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div>
                <span className="font-extrabold block">Connected to Live Supabase Database!</span>
                <span className="text-[11px] opacity-80">All edits in Admin and Catalogue will now sync directly to Supabase cloud storage.</span>
              </div>
            </div>
          )}

          {testStatus === 'error' && (
            <div className="bg-red-50 border border-red-200 text-red-900 p-3.5 rounded-xl text-xs flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div>
                <span className="font-extrabold block">Connection Check Notice</span>
                <span className="text-[11px] leading-tight block">{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Input 1: Supabase URL */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-gray-500" />
              <span>Project URL (VITE_SUPABASE_URL)</span>
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-project-id.supabase.co"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-emerald-500 font-mono"
            />
            <p className="text-[10px] text-gray-400 mt-1">Found in Supabase Dashboard -&gt; Project Settings -&gt; API</p>
          </div>

          {/* Input 2: Supabase Anon Key */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-gray-500" />
              <span>Anon Public Key (VITE_SUPABASE_ANON_KEY)</span>
            </label>
            <textarea
              rows={3}
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:outline-none focus:border-emerald-500 font-mono resize-none"
            />
            <p className="text-[10px] text-gray-400 mt-1">Found under `anon` `public` API keys in your Supabase project settings.</p>
          </div>

          {/* Info Banner */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-[11px] text-gray-600 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-gray-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Where are these saved?</span>
            </div>
            <p>
              Credentials saved here are securely stored in your browser session for live client queries. For permanent deployment on Vercel or Netlify, add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to your environment variables.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 border-t border-gray-100 p-4 flex items-center justify-between gap-3">
          <button
            onClick={handleClearCredentials}
            className="text-gray-500 hover:text-red-600 text-xs font-semibold cursor-pointer"
          >
            Clear Stored Credentials
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleTestAndSave}
              disabled={isTesting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
            >
              {isTesting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Test &amp; Connect Supabase</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
