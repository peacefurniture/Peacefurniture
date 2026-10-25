import React from 'react';
import { Search, Camera } from 'lucide-react';

interface HeroProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: (e?: React.FormEvent) => void;
  onOpenImageSearch: () => void;
  onFocusSearch: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onOpenImageSearch,
  onFocusSearch,
}) => {
  return (
    <div className="relative">
      {/* Dark Hero Banner */}
      <div className="relative bg-[#0F1115] overflow-hidden">
        {/* Background photo & dark cinematic gradient */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1600&q=80"
            alt="Modern living room interior"
            className="w-full h-full object-cover object-center opacity-30 md:opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F1115] via-[#0F1115]/90 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F1115] via-transparent to-transparent"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-7 pb-14 sm:pt-10 sm:pb-18">
          <div className="max-w-xl">
            {/* Tagline */}
            <p className="text-[11px] sm:text-xs font-semibold tracking-[0.2em] text-gray-300 uppercase mb-2">
              Modern • Stylish • Comfortable
            </p>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-[1.15] mb-2 sm:mb-3">
              Furniture <span className="text-[#E11D2A]">Catalogue</span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-gray-300 font-normal leading-relaxed mb-4 max-w-md">
              Explore a wide range of furniture for every space.
            </p>

            {/* Red accent bar */}
            <div className="w-12 h-1 bg-[#E11D2A] rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Floating Inset Search Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-7 sm:-mt-8 relative z-20">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSearchSubmit(e);
          }}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 p-1.5 sm:p-2 flex items-center gap-2"
        >
          {/* Search Icon & Text Input */}
          <div className="flex-1 flex items-center pl-2 sm:pl-3 gap-2">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={onFocusSearch}
              placeholder="Search furniture (e.g. sofa, chair, table...)"
              className="w-full text-xs sm:text-sm text-gray-800 placeholder-gray-400 bg-transparent focus:outline-none py-1.5"
            />
          </div>

          {/* Search by Image Button */}
          <button
            type="button"
            onClick={onOpenImageSearch}
            className="flex-shrink-0 bg-[#E11D2A] hover:bg-[#C51322] text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <Camera className="w-4 h-4" />
            <span className="hidden xs:inline sm:inline">Search by Image</span>
          </button>
        </form>
      </div>
    </div>
  );
};
