import React, { useState, useRef } from 'react';
import { X, Upload, Sparkles, Image as ImageIcon, CheckCircle, ArrowRight } from 'lucide-react';

interface ImageSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyImageSearch: (imageUrl: string, queryHint: string) => void;
}

export const ImageSearchModal: React.FC<ImageSearchModalProps> = ({
  isOpen,
  onClose,
  onApplyImageSearch,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [detectedCategory, setDetectedCategory] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const samplePresets = [
    {
      name: 'Solid Wood Dining Set',
      query: 'wooden dining table',
      image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=400&q=80',
      detected: 'Dining Table & 6 Chairs (Teak Wood)',
    },
    {
      name: 'Modern Beige 3-Seater Sofa',
      query: 'sofa',
      image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80',
      detected: 'Contemporary 3-Seater Fabric Sofa',
    },
    {
      name: 'Ergonomic Desk Chair',
      query: 'office chair',
      image: 'https://images.unsplash.com/photo-1580481077195-c546a9a0f02e?auto=format&fit=crop&w=400&q=80',
      detected: 'High-back Ergonomic Task Chair',
    },
    {
      name: 'Solid Wood King Bed',
      query: 'bed',
      image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=400&q=80',
      detected: 'King Size Sheesham Platform Bed',
    },
  ];

  const processImageWithGemini = async (imageDataOrUrl: string, fallbackQuery: string) => {
    setPreviewImage(imageDataOrUrl);
    setAnalyzing(true);

    try {
      const res = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageDataOrUrl }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.analysis) {
          const query = data.analysis.suggestedSearchQuery || data.analysis.category || fallbackQuery;
          setDetectedCategory(data.analysis.itemType || 'Furniture Identified');
          setAnalyzing(false);
          onApplyImageSearch(imageDataOrUrl, query);
          onClose();
          return;
        }
      }
    } catch (err) {
      console.warn('Gemini image search fallback:', err);
    }

    // Fallback if network or API key issue
    setAnalyzing(false);
    onApplyImageSearch(imageDataOrUrl, fallbackQuery);
    onClose();
  };

  const handleSelectImage = (imgUrl: string, detected: string, query: string) => {
    processImageWithGemini(imgUrl, query);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        processImageWithGemini(result, 'furniture');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div
        className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-red-50/40">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#E11D2A] text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900 text-base leading-none">
                Search by Image (AI)
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5 font-medium">
                Visual similarity search for catalog furniture
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Upload Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              const file = e.dataTransfer.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = () => {
                  const result = reader.result as string;
                  processImageWithGemini(result, 'furniture');
                };
                reader.readAsDataURL(file);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
              dragActive
                ? 'border-[#E11D2A] bg-red-50/60'
                : 'border-gray-200 hover:border-red-300 hover:bg-gray-50/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#E11D2A] flex items-center justify-center mx-auto mb-3 shadow-xs">
              <Upload className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-gray-900 text-sm mb-1">
              Click to upload or drag & drop photo
            </h4>
            <p className="text-xs text-gray-500">
              Supports JPG, PNG, WEBP from your camera roll or desktop
            </p>
          </div>

          {/* Analysis State Indicator */}
          {analyzing && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center animate-pulse">
              <div className="flex items-center justify-center gap-2 text-[#E11D2A] font-bold text-xs mb-1">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>AI Analyzing Furniture Characteristics...</span>
              </div>
              <p className="text-[11px] text-gray-600">
                Detecting silhouette, wood tones, and upholstery textures to match catalogue items.
              </p>
            </div>
          )}

          {/* Instant Sample Presets */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                Or Try Sample Photos
              </span>
              <span className="text-[11px] text-gray-400">Click to search instantly</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {samplePresets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() =>
                    handleSelectImage(preset.image, preset.detected, preset.query)
                  }
                  className="flex items-center gap-2.5 p-2 rounded-xl border border-gray-200 hover:border-[#E11D2A] hover:bg-red-50/30 text-left transition-all cursor-pointer group"
                >
                  <img
                    src={preset.image}
                    alt={preset.name}
                    className="w-11 h-11 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="overflow-hidden">
                    <span className="font-bold text-gray-800 text-xs block truncate group-hover:text-[#E11D2A]">
                      {preset.name}
                    </span>
                    <span className="text-[10px] text-gray-400 block truncate">
                      {preset.detected}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>Powered by Peace Furniture Visual Search</span>
          <button
            onClick={onClose}
            className="text-gray-700 hover:text-gray-900 font-semibold cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
