import React from 'react';
import { HomeCraftLogo } from './HomeCraftLogo';
import { Category, CategoryId } from '../types';

interface FooterProps {
  onNavigate: (view: 'home' | 'search' | 'admin') => void;
  onSelectCategory: (cat: CategoryId) => void;
  categories: Category[];
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onSelectCategory, categories }) => {
  return (
    <footer className="bg-[#0F1115] text-white border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand info */}
          <div className="space-y-2">
            <HomeCraftLogo size="md" />
            <p className="text-xs text-gray-400 max-w-sm">
              Peace Furniture House - Your premier destination for modern, stylish furniture.
            </p>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3">Categories</h4>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-gray-400">
              {categories.filter(c => c.id !== 'other').map((cat) => (
                <button 
                  key={cat.id}
                  onClick={() => {
                    onSelectCategory(cat.id);
                    onNavigate('home');
                  }} 
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Support */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">Customer Support</h4>
            <p className="text-xs text-gray-400">
              Helpline: <span className="text-white font-semibold">+91 90601 02626</span>
            </p>
            <p className="text-xs text-gray-400">9 AM - 9 PM | Daily</p>
            <p className="text-xs text-gray-400 pt-1">
              Bawa Builders, G.K. Smart City ,BC Road -574 219
            </p>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-6 border-t border-gray-800/60 flex flex-col md:flex-row justify-between items-center gap-4 text-[11px] text-gray-500">
          <p>© {new Date().getFullYear()} Peace Furniture House Catalogue. All rights reserved.</p>
          <div className="flex gap-4">
             <button onClick={() => onNavigate('admin')} className="hover:text-emerald-400 transition-colors">Admin</button>
          </div>
        </div>
      </div>
    </footer>
  );
};
