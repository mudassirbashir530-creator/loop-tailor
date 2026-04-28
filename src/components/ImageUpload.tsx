import React from 'react';
import { Camera, Loader2, X } from 'lucide-react';

interface ImageUploadProps {
  label: string;
  preview: string | null;
  uploading?: boolean;
  error?: string | null;
  onSelectFile: (file: File) => void;
  onReset?: () => void;
  className?: string;
}

/**
 * Reusable image upload UI.
 * - Shows pick button
 * - Shows image preview when selected
 * - Shows spinner while uploading
 * - Shows validation/upload errors
 */
export default function ImageUpload({
  label,
  preview,
  uploading = false,
  error,
  onSelectFile,
  onReset,
  className = ''
}: ImageUploadProps) {
  return (
    <div className={className}>
      <label className="relative cursor-pointer group block">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onSelectFile(file);
          }}
        />

        {preview ? (
          <div className="w-full h-32 border-none shadow-neu-pressed-sm rounded-2xl relative overflow-hidden bg-gray-100 flex items-center justify-center">
            <img src={preview} alt={label} className="h-full object-contain p-2" />
            {onReset && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onReset();
                }}
                className="absolute top-2 right-2 bg-gray-100 shadow-neu-sm p-1.5 rounded-full hover:shadow-neu-pressed-sm text-slate-600 transition-all"
              >
                <X size={16} />
              </button>
            )}
          </div>
        ) : (
          <div className="w-full h-32 border-none shadow-neu-sm rounded-2xl flex flex-col items-center justify-center cursor-pointer bg-gray-100 hover:shadow-neu-pressed-sm transition-all group">
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-brand-primary mb-2" />
            ) : (
              <Camera className="h-8 w-8 text-slate-400 group-hover:text-brand-primary mb-2 transition-colors" />
            )}
            <span className="text-sm font-medium text-slate-500 group-hover:text-brand-primary transition-colors">
              {uploading ? 'Uploading...' : label}
            </span>
          </div>
        )}
      </label>

      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
    </div>
  );
}
