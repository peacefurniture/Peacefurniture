import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, ShieldCheck, Eye, EyeOff, Sparkles, ArrowLeft } from 'lucide-react';
import { HomeCraftLogo } from './HomeCraftLogo';
import { AdminUser } from '../types';

interface AdminAuthViewProps {
  onLoginSuccess: (user: AdminUser) => void;
  onBackToStore: () => void;
}

export const AdminAuthView: React.FC<AdminAuthViewProps> = ({
  onLoginSuccess,
  onBackToStore,
}) => {
  const [email, setEmail] = useState('admin@peacefurniture.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      // Validate credentials
      const cleanEmail = email.trim().toLowerCase();
      if (
        (cleanEmail.startsWith('admin@') && password === 'admin123') ||
        (cleanEmail.startsWith('manager@') && password === 'manager123')
      ) {
        const user: AdminUser = {
          email: cleanEmail,
          name: cleanEmail.includes('admin') ? 'Peace Furniture Administrator' : 'Catalogue Inventory Manager',
          role: cleanEmail.includes('admin') ? 'super_admin' : 'store_manager',
        };
        setIsLoading(false);
        onLoginSuccess(user);
      } else {
        setIsLoading(false);
        setError('Invalid credentials. Use demo: admin@peacefurniture.com / admin123');
      }
    }, 600);
  };

  const handleFillDemo = (type: 'admin' | 'manager') => {
    if (type === 'admin') {
      setEmail('admin@peacefurniture.com');
      setPassword('admin123');
    } else {
      setEmail('manager@peacefurniture.com');
      setPassword('manager123');
    }
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#0F1115] text-white flex flex-col justify-center py-8 sm:py-12 px-3 sm:px-6 lg:px-8 relative overflow-hidden pb-20">
      {/* Decorative background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 sm:w-96 h-80 sm:h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Back to Public Catalogue button */}
      <div className="max-w-md w-full mx-auto mb-4 sm:mb-6 flex justify-between items-center z-10 px-1">
        <button
          onClick={onBackToStore}
          className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer py-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Public Store</span>
        </button>
      </div>

      <div className="max-w-md w-full mx-auto z-10">
        <div className="bg-[#171A21] border border-gray-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-5 sm:mb-6">
            <div className="inline-flex justify-center mb-3">
              <HomeCraftLogo size="md" />
            </div>
            <div className="inline-flex items-center gap-1.5 bg-red-500/10 text-red-400 text-[11px] sm:text-xs font-bold px-3 py-1 rounded-full border border-red-500/20 mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Restricted Admin Portal</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Inventory & Catalogue Manager
            </h2>
            <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
              Sign in to manage, add, hide, or remove furniture catalogue items.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-300 font-semibold text-center">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@homecraft.com"
                  className="w-full bg-[#0F1115] border border-gray-700 rounded-xl pl-10 pr-3 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#E11D2A] focus:ring-1 focus:ring-[#E11D2A]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0F1115] border border-gray-700 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#E11D2A] focus:ring-1 focus:ring-[#E11D2A]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors cursor-pointer p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#E11D2A] hover:bg-[#C51322] active:bg-[#B0101E] text-white py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-red-600/30 mt-2"
            >
              {isLoading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In to Admin Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Assistant */}
          <div className="mt-5 pt-4 sm:mt-6 sm:pt-5 border-t border-gray-800 text-center">
            <span className="text-[11px] text-gray-400 block mb-2 font-medium">
              Quick One-Click Demo Credentials:
            </span>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => handleFillDemo('admin')}
                className="text-xs bg-white/5 hover:bg-white/10 border border-gray-700 px-3 py-1.5 rounded-lg text-gray-300 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Super Admin</span>
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('manager')}
                className="text-xs bg-white/5 hover:bg-white/10 border border-gray-700 px-3 py-1.5 rounded-lg text-gray-300 transition-colors cursor-pointer"
              >
                Store Manager
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
