import React, { useState, useEffect } from 'react';
import { X, Database, Check, AlertCircle, RefreshCw, Key, Link as LinkIcon, Server } from 'lucide-react';
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
  onSaved: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setUrl(getSupabaseUrl());
      setAnonKey(getSupabaseAnonKey());
      setStatus(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!url.trim() || !anonKey.trim()) {
      setStatus({ type: 'error', message: 'Please enter both Supabase URL and Anon Key.' });
      return;
    }

    try {
      saveSupabaseCredentials(url.trim(), anonKey.trim());
      setStatus({ type: 'success', message: 'Database connection credentials saved!' });
      onSaved();
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'Failed to save credentials.' });
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setStatus({ type: 'info', message: 'Testing database connection...' });
    try {
      if (url.trim() && anonKey.trim()) {
        saveSupabaseCredentials(url.trim(), anonKey.trim());
      }
      const health = await runDatabaseHealthCheck();
      if (health.ok) {
        setStatus({
          type: 'success',
          message: health.supabaseUrl
            ? `Database Connected Successfully to Supabase (${health.supabaseUrl})`
            : 'Connected to Local Persistent Catalogue Storage (Healthy)',
        });
      } else {
        setStatus({
          type: 'error',
          message: 'Database check failed. Falling back to Local Storage.',
        });
      }
    } catch (err: any) {
      setStatus({
        type: 'error',
        message: `Connection Error: ${err.message || 'Could not connect to database'}`,
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 sm:backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900 text-base">Database Connection Settings</h3>
              <p className="text-xs text-gray-500">Connect Supabase Cloud Database or manage storage</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-800 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {status && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2.5 border ${
                status.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : status.type === 'error'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}
            >
              {status.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              ) : status.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              ) : (
                <RefreshCw className="w-4 h-4 text-blue-600 animate-spin flex-shrink-0" />
              )}
              <span>{status.message}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-emerald-600" />
              <span>Supabase Project URL</span>
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-project.supabase.co"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-emerald-600 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-emerald-600" />
              <span>Supabase Anon / API Key</span>
            </label>
            <input
              type="password"
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-emerald-600 font-mono"
            />
          </div>

          <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 text-xs text-gray-600 leading-relaxed">
            <span className="font-bold text-gray-800 block mb-1">⚡ Hybrid Connection Mode Active</span>
            When credentials are set, changes sync directly to Supabase Cloud Database & Storage. If Supabase is unreachable or offline, the system safely falls back to local browser storage without breaking your app.
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between gap-3">
          <button
            onClick={handleTestConnection}
            disabled={testing}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
            <span>Test Connection</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-md shadow-emerald-600/20"
            >
              Save Credentials
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
