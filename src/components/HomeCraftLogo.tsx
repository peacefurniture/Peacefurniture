import React from 'react';

export const LOGO_IMAGE_URL = '/assets/aistudio/20250528_205745.png';

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
      ? 'w-8 h-8'
      : size === 'lg'
      ? 'w-12 h-12'
      : 'w-10 h-10';

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Uploaded Logo Image Icon */}
      <div className={`relative flex-shrink-0 rounded-xl overflow-hidden bg-white flex items-center justify-center shadow-sm border border-white/20 p-0.5 ${sizeClasses}`}>
        <img
          src={LOGO_IMAGE_URL}
          alt="Peace Furniture House Logo"
          className="w-full h-full object-contain"
        />
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col justify-center leading-none">
        <div className="flex items-center">
          <span className="font-extrabold text-white tracking-tight text-sm sm:text-base lg:text-lg whitespace-nowrap">
            Peace Furniture <span className="text-[#E11D2A]">House</span>
          </span>
        </div>
        {showSubtitle && (
          <span className="text-[9px] sm:text-[10px] tracking-wider text-gray-400 font-semibold uppercase mt-0.5">
            Furniture Catalogue
          </span>
        )}
      </div>
    </div>
  );
};

