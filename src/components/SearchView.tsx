import React, { useState } from 'react';
import { Search, X, SlidersHorizontal, Image as ImageIcon, Sparkles, Upload, RefreshCw } from 'lucide-react';
import { FurnitureItem } from '../types';
import { ProductCard } from './ProductCard';

interface SearchViewProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onClearSearch: () => void;
  onTriggerSearch: () => void;
  onOpenImageSearch: () => void;
  onOpenFilter: () => void;
  results: FurnitureItem[];
  totalResultsCount?: number;
  wishlistIds: Set<string>;
  onToggleWishlist: (item: FurnitureItem) => void;
  onViewDetails: (item: FurnitureItem) => void;
  activeImageSearch?: string | null;
  onClearImageSearch?: () => void;
}

export const SearchView: React.FC<SearchViewProps> = ({
  searchQuery,
  onSearchChange,
  onClearSearch,
  onTriggerSearch,
  onOpenImageSearch,
  onOpenFilter,
  results,
  totalResultsCount,
  wishlistIds,
  onToggleWishlist,
  onViewDetails,
  activeImageSearch,
  onClearImageSearch,
}) => {
  const [selectedQuickChip, setSelectedQuickChip] = useState<string>(
    searchQuery || 'wooden dining table'
  );

  const quickSearches = [
    'wooden dining table',
    '3 seater sofa',
    'king size bed',
    'office chair',
    'marble top',
    'wardrobe',
  ];

  const handleChipClick = (term: string) => {
    setSelectedQuickChip(term);
    onSearchChange(term);
  };

  const displayCount = totalResultsCount ?? results.length;

  return (
    <div className="pb-16 bg-[#FAFAFA] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5">
        {/* Title & Subtitle */}
        <div className="mb-4">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight">
            Search Furniture
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 font-normal">
            Find furniture using text or image with AI.
          </p>
        </div>

        {/* Search Input Bar + Red Search Button */}
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1 flex items-center bg-white border border-gray-200 rounded-xl shadow-xs px-3 py-2.5 focus-within:ring-2 focus-within:ring-[#E11D2A]/20 focus-within:border-[#E11D2A] transition-all">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mr-2 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onTriggerSearch();
                }
              }}
              placeholder="Search furniture..."
              className="w-full text-xs sm:text-sm text-gray-900 placeholder-gray-400 bg-transparent focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={onClearSearch}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors ml-1 cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onTriggerSearch}
            className="bg-[#E11D2A] hover:bg-[#C51322] active:bg-[#B0101E] text-white px-5 sm:px-7 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold tracking-wide transition-colors cursor-pointer shadow-sm flex-shrink-0"
          >
            Search
          </button>
        </div>

        {/* Quick Search Suggestions */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 mb-5">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mr-1 flex-shrink-0">
            Popular:
          </span>
          {quickSearches.map((term) => (
            <button
              key={term}
              onClick={() => handleChipClick(term)}
              className={`text-xs px-3 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer border ${
                searchQuery.toLowerCase() === term.toLowerCase()
                  ? 'bg-red-50 text-[#E11D2A] border-red-200 font-semibold'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {term}
            </button>
          ))}
        </div>

        {/* "Search by Image (AI)" Banner Card */}
        <div className="bg-[#FFF3F3] border border-[#FCD5D8] rounded-2xl p-5 sm:p-6 mb-7 text-center relative overflow-hidden shadow-xs">
          {/* Active Image Indicator if uploaded */}
          {activeImageSearch ? (
            <div className="flex flex-col items-center">
              <div className="relative mb-3 inline-block">
                <img
                  src={activeImageSearch}
                  alt="Visual Search Query"
                  className="w-24 h-24 object-cover rounded-xl border-2 border-[#E11D2A] shadow-md"
                />
                <button
                  onClick={onClearImageSearch}
                  className="absolute -top-2 -right-2 bg-gray-900 text-white rounded-full p-1 shadow-md hover:bg-black transition-colors cursor-pointer"
                  title="Remove uploaded image"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="inline-flex items-center gap-1.5 bg-[#E11D2A]/10 text-[#E11D2A] px-3 py-1 rounded-full text-xs font-bold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Visual Match Active (96% Confidence)</span>
              </div>
              <p className="text-xs text-gray-600 mb-3">
                Showing matching catalogue pieces with similar wood tone, silhouette, and proportions.
              </p>
              <button
                onClick={onOpenImageSearch}
                className="bg-white border border-gray-300 hover:border-gray-400 text-gray-800 text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Try Another Photo
              </button>
            </div>
          ) : (
            <div>
              {/* Camera/Image Icon Badge */}
              <div className="w-12 h-12 rounded-2xl bg-white border border-red-200 text-[#E11D2A] flex items-center justify-center mx-auto mb-3 shadow-xs">
                <ImageIcon className="w-6 h-6 stroke-[1.8]" />
              </div>

              {/* Title & Description */}
              <h3 className="font-extrabold text-gray-900 text-base sm:text-lg mb-1 tracking-tight">
                Search by Image (AI)
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mb-4 font-normal">
                Upload a photo to find similar furniture.
              </p>

              {/* Upload Image Red Button */}
              <button
                type="button"
                onClick={onOpenImageSearch}
                className="bg-[#E11D2A] hover:bg-[#C51322] active:bg-[#B0101E] text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm hover:shadow inline-flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Image</span>
              </button>
            </div>
          )}
        </div>

        {/* Search Results Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-950 tracking-tight">
              Search Results
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">
              Showing {displayCount} results for "{searchQuery || 'wooden dining table'}"
            </p>
          </div>

          {/* Filters Button */}
          <button
            onClick={onOpenFilter}
            className="bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-800 border border-gray-200 hover:border-gray-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
          >
            <SlidersHorizontal className="w-4 h-4 text-gray-700" />
            <span>Filters</span>
          </button>
        </div>

        {/* Search Results Grid - 2 cols on mobile (exact match with screenshot) */}
        {results.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {results.map((item) => (
              <ProductCard
                key={item.id}
                product={item}
                isWishlisted={wishlistIds.has(item.id)}
                onToggleWishlist={onToggleWishlist}
                onViewDetails={onViewDetails}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 sm:p-12 text-center border border-gray-200 max-w-md mx-auto my-6 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-red-50 text-[#E11D2A] flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900 text-base mb-1">No matching results</h3>
            <p className="text-xs text-gray-500 mb-4">
              We couldn't find items matching "{searchQuery}". Try searching for "dining table", "sofa", or use AI Image Search.
            </p>
            <button
              onClick={() => {
                onSearchChange('wooden dining table');
              }}
              className="bg-[#E11D2A] text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-[#C51322] transition-colors cursor-pointer"
            >
              Search "wooden dining table"
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
