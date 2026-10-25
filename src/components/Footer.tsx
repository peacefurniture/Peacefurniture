import React from 'react';
import { HomeCraftLogo } from './HomeCraftLogo';
import { ShieldCheck, Truck, Headphones, RotateCcw } from 'lucide-react';
import { CategoryId } from '../types';

interface FooterProps {
  onNavigate: (view: 'home' | 'search' | 'admin') => void;
  onSelectCategory: (cat: CategoryId) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onSelectCategory }) => {
  return (
    <footer className="bg-[#0F1115] text-white border-t border-gray-800">
      {/* Value Badges */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 border-b border-gray-800/80">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 text-[#E11D2A] flex items-center justify-center flex-shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h5 className="font-bold text-xs sm:text-sm text-gray-200">Free White-Glove Delivery</h5>
              <p className="text-[11px] text-gray-400 mt-0.5">Across 40+ major cities in India</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 text-[#E11D2A] flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h5 className="font-bold text-xs sm:text-sm text-gray-200">Up to 10 Years Warranty</h5>
              <p className="text-[11px] text-gray-400 mt-0.5">Solid Sheesham & Teak wood</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 text-[#E11D2A] flex items-center justify-center flex-shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h5 className="font-bold text-xs sm:text-sm text-gray-200">7-Day Easy Return</h5>
              <p className="text-[11px] text-gray-400 mt-0.5">Zero questions asked exchange</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 text-[#E11D2A] flex items-center justify-center flex-shrink-0">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h5 className="font-bold text-xs sm:text-sm text-gray-200">Interior Design Support</h5>
              <p className="text-[11px] text-gray-400 mt-0.5">Free 3D layout consultation</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand info */}
          <div className="space-y-3">
            <HomeCraftLogo size="md" />
            <p className="text-xs text-gray-400 leading-relaxed max-w-sm">
              Peace Furniture is your premier furniture catalogue destination for modern, stylish, and durable home and office furniture with AI visual discovery.
            </p>
          </div>

          {/* Quick Pages */}
          <div>
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3">
              Explore Pages
            </h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li>
                <button
                  onClick={() => onNavigate('home')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Page 1: Furniture Catalogue (Home)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('search')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Page 2: Search Furniture & AI Visual Search
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('admin')}
                  className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin Portal (Manage Inventory)</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Top Categories */}
          <div>
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3">
              Categories
            </h4>
            <ul className="space-y-1.5 text-xs text-gray-400">
              <li>
                <button
                  onClick={() => {
                    onSelectCategory('sofas');
                    onNavigate('home');
                  }}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Sofas & Lounges
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    onSelectCategory('dining');
                    onNavigate('home');
                  }}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Dining Sets & Tables
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    onSelectCategory('beds');
                    onNavigate('home');
                  }}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Beds & Mattresses
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    onSelectCategory('office');
                    onNavigate('home');
                  }}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Ergonomic Office Chairs
                </button>
              </li>
            </ul>
          </div>

          {/* Experience Centers */}
          <div>
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3">
              Customer Support
            </h4>
            <p className="text-xs text-gray-400 leading-relaxed mb-2">
              Helpline: <span className="text-white font-bold">1800-419-PEACE</span> (9 AM - 9 PM)
            </p>
            <p className="text-xs text-gray-400 leading-relaxed">
              Experience Centers located in Mumbai, Bengaluru, Delhi NCR, Hyderabad, and Pune.
            </p>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-8 pt-6 border-t border-gray-800/60 text-center text-[11px] text-gray-500">
          © {new Date().getFullYear()} Peace Furniture Catalogue. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
