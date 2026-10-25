import React from 'react';
import { X, Home, Search, MapPin, Phone, Layers, Sparkles } from 'lucide-react';
import { HomeCraftLogo } from './HomeCraftLogo';
import { Category, CategoryId } from '../types';
import { CATEGORIES } from '../data/furnitureData';

interface NavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: 'home' | 'search' | 'admin') => void;
  onSelectCategory: (cat: CategoryId) => void;
  categories?: Category[];
}

export const NavDrawer: React.FC<NavDrawerProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onSelectCategory,
  categories,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
      <div
        className="w-full max-w-xs sm:max-w-sm bg-[#0F1115] text-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
        role="dialog"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-800 flex items-center justify-between">
          <HomeCraftLogo size="sm" />
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Main Navigation */}
          <div className="space-y-1">
            <button
              onClick={() => {
                onNavigate('home');
                onClose();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-white/10 transition-colors text-left text-gray-200 hover:text-white cursor-pointer"
            >
              <Home className="w-4 h-4 text-[#E11D2A]" />
              <span>Catalogue Home</span>
            </button>

            <button
              onClick={() => {
                onNavigate('search');
                onClose();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-white/10 transition-colors text-left text-gray-200 hover:text-white cursor-pointer"
            >
              <Search className="w-4 h-4 text-[#E11D2A]" />
              <span>Search Furniture</span>
            </button>

            <button
              onClick={() => {
                onNavigate('admin');
                onClose();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-white/10 transition-colors text-left text-emerald-400 hover:text-emerald-300 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Admin Portal (Manage Inventory)</span>
            </button>
          </div>

          {/* Categories */}
          <div>
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-red-500" />
              <span>Browse Collections</span>
            </div>
            <div className="grid grid-cols-2 gap-1 px-1">
              {(categories
                ? categories.filter((c) => c.id !== 'all' && c.isActive !== false)
                : CATEGORIES.slice(1)
              ).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    onSelectCategory(cat.id);
                    onNavigate('home');
                    onClose();
                  }}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors text-left truncate cursor-pointer"
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* AI Feature Callout */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-red-950/60 to-red-900/30 border border-red-800/40">
            <div className="flex items-center gap-2 text-[#E11D2A] font-bold text-xs mb-1">
              <Sparkles className="w-4 h-4" />
              <span>AI Visual Furniture Search</span>
            </div>
            <p className="text-[11px] text-gray-300 mb-2 leading-relaxed">
              Snap a picture of any sofa or dining table to discover exact or matching designs from our catalogue.
            </p>
            <button
              onClick={() => {
                onNavigate('search');
                onClose();
              }}
              className="bg-[#E11D2A] hover:bg-[#C51322] text-white text-xs font-semibold px-3 py-1.5 rounded-lg w-full cursor-pointer transition-colors"
            >
              Try AI Image Search
            </button>
          </div>

          {/* Contact & Support */}
          <div className="space-y-2 pt-2 border-t border-gray-800/80 text-xs text-gray-400 px-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-gray-500" />
              <span>Flagship Experience Centers in 12 Cities</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-gray-500" />
              <span>Toll Free Support: 1800-419-PEACE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
