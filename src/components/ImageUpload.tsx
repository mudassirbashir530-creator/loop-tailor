import React, { useState, useRef } from "react";
import { Upload, Loader2, X } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { useLanguage } from "../contexts/LanguageContext";

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  className?: string;
  disabled?: boolean;
}

export function ImageUpload({ value, onChange, className, disabled }: ImageUploadProps) {
  const { t, isRTL } = useLanguage();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    if (file.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5MB limit");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Invalid file type. Use JPG, PNG, or WEBP.");
      return;
    }

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to upload image");
      }

      const data = await response.json();
      if (data.url) {
        onChange(data.url);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Something went wrong during upload");
    } finally {
      setIsUploading(false);
      // Reset input so the same file can be uploaded again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className={cn("relative", className)}>
      {isUploading ? (
        <div className="flex flex-col items-center justify-center h-32 w-full rounded-[12px] bg-[#F2F4F0] border border-dashed border-[#8A9E94]/30">
          <Loader2 className="w-6 h-6 animate-spin text-[#1A4A3A] mb-2" />
          <span className="text-sm font-bold text-[#8A9E94]">Uploading...</span>
        </div>
      ) : value ? (
        <div className="relative h-32 w-full rounded-[12px] bg-[#F2F4F0] overflow-hidden group">
          <img src={value} alt="Uploaded" className="w-full h-full object-cover" />
          {!disabled && (
            <div className="absolute inset-0 bg-[#111C17]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button 
                type="button" 
                variant="destructive" 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(null);
                }} 
                className="h-[32px] rounded-[8px] bg-[#DC2626] font-bold"
              >
                <X className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} /> {t('quickOrder.remove')}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div 
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={cn(
            "flex flex-col items-center justify-center h-32 w-full rounded-[12px] bg-[#F2F4F0] hover:bg-[#EEF1ED] transition-all cursor-pointer border border-dashed border-[#8A9E94]/30",
            disabled && "opacity-50 cursor-not-allowed pointer-events-none"
          )}
        >
          <Upload className="h-6 w-6 text-[#1A4A3A] mb-2" />
          <span className="text-sm font-bold text-[#8A9E94]">{t('quickOrder.clickToUpload')}</span>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            disabled={disabled}
          />
        </div>
      )}

      {error && (
        <p className="text-sm text-[#DC2626] font-medium mt-1 pl-1">{error}</p>
      )}
    </div>
  );
}
