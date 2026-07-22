import { useState } from 'react';
import { uploadToCloudinary } from '../lib/cloudinary';
import { CloudinaryImage } from '../lib/types';

export interface UseImageUploadReturn {
  file: File | null;
  preview: string | null;
  uploading: boolean;
  progress: number;
  uploadedUrl: string | null;
  error: string | null;
  selectFile: (file: File) => void;
  uploadToStorage: (path?: string) => Promise<string | null>;
  reset: () => void;
}

export function useImageUpload(): UseImageUploadReturn {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectFile = (selectedFile: File) => {
    setError(null);
    if (!selectedFile.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    // Set max file upload selected size to 20MB globally for select
    if (selectedFile.size > 20 * 1024 * 1024) {
      setError('Initial file size must be less than 20MB.');
      return;
    }
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  };

  const uploadToStorage = async (path?: string): Promise<string | null> => {
    if (!file) return null;
    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      const imgInfo = await uploadToCloudinary(file, (progressValue) => {
        setProgress(progressValue);
      });
      
      const finalUrl = typeof imgInfo === 'string' ? imgInfo : imgInfo.url;
      setUploadedUrl(finalUrl);
      setUploading(false);
      setProgress(100);
      return finalUrl;
    } catch (err: any) {
      console.error("❌ useImageUpload: Upload failed", err);
      setError(err.message || 'Upload failed');
      setUploading(false);
      return null;
    }
  };

  const reset = () => {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setUploading(false);
    setProgress(0);
    setUploadedUrl(null);
    setError(null);
  };

  return { file, preview, uploading, progress, uploadedUrl, error, selectFile, uploadToStorage, reset };
}
