import React from 'react';

interface HomeCraftLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const HomeCraftLogo: React.FC<HomeCraftLogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = true,
}) => {
  const sizeClasses =
    size === 'sm'
      ? 'w-7 h-7'
      : size === 'lg'
      ? 'w-12 h-12'
      : 'w-9 h-9';

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Uploaded Logo Image Icon */}
      <div className={`relative flex-shrink-0 rounded-xl overflow-hidden bg-black flex items-center justify-center shadow-md border border-red-500/30 ${sizeClasses}`}>
        <img
          src="/public/assets/aistudio/file_0000000028a8820a80dd4bb4fb9ec759_bae25683.png"
          alt="Peace Furniture Logo"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col leading-none">
        <div className="flex items-center">
          <span className="font-extrabold text-white tracking-tight text-base sm:text-lg">
            Peace <span className="text-[#E11D2A]">Furniture</span>
          </span>
        </div>
        {showSubtitle && (
          <span className="text-[9px] sm:text-[10px] tracking-wider text-gray-300 font-semibold uppercase mt-0.5">
            Furniture Catalogue
          </span>
        )}
      </div>
    </div>
  );
};
