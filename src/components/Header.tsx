import { Search, Menu, ArrowLeft, Sparkles, ShieldCheck } from 'lucide-react';
import { HomeCraftLogo } from './HomeCraftLogo';

interface HeaderProps {
  currentView: 'home' | 'search' | 'admin';
  onNavigate: (view: 'home' | 'search' | 'admin') => void;
  onOpenMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  onOpenMenu,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0F1115] border-b border-gray-800/80 px-4 py-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Back button (if in search or admin) + Logo */}
        <div className="flex items-center gap-3">
          {(currentView === 'search' || currentView === 'admin') && (
            <button
              onClick={() => onNavigate('home')}
              className="text-white hover:text-red-400 p-1.5 -ml-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              aria-label="Back to home"
              title="Back to Catalogue"
            >
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          )}

          <div
            onClick={() => onNavigate('home')}
            className="cursor-pointer transition-opacity hover:opacity-90"
          >
            <HomeCraftLogo size="md" />
          </div>
        </div>

        {/* Center Desktop Navigation: Page 1 (Catalogue), Page 2 (Search), Admin */}
        <nav className="hidden md:flex items-center gap-1 bg-white/5 border border-white/10 rounded-full px-2 py-1">
          <button
            onClick={() => onNavigate('home')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              currentView === 'home'
                ? 'bg-[#E11D2A]' + ' text-white shadow-sm'
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            Furniture Catalogue
          </button>
          <button
            onClick={() => onNavigate('search')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              currentView === 'search'
                ? 'bg-[#E11D2A]' + ' text-white shadow-sm'
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Search & AI Image Search</span>
          </button>
          <button
            onClick={() => onNavigate('admin')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              currentView === 'admin'
                ? 'bg-[#E11D2A]' + ' text-white shadow-sm'
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Admin Portal</span>
          </button>
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {currentView === 'home' && (
            <button
              onClick={() => onNavigate('search')}
              className="text-white/90 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Search"
              title="Search furniture"
            >
              <Search className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
            </button>
          )}

          {/* Admin shortcut button for tablet/mobile */}
          <button
            onClick={() => onNavigate('admin')}
            className="md:hidden text-white/90 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Admin Portal"
            title="Admin Portal"
          >
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </button>

          {/* Menu button */}
          <button
            onClick={onOpenMenu}
            className="text-white/90 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Open menu"
            title="Menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>
    </header>
  );
};
