import { useState } from 'react';
import { uploadImageFile } from '../lib/apiHelpers';

export interface UseImageUploadReturn {
  file: File | null;
  preview: string | null;
  uploading: boolean;
  progress: number;
  uploadedUrl: string | null;
  error: string | null;
  selectFile: (file: File) => void;
  uploadToStorage: (path: string) => Promise<string | null>;
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
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(selectedFile.type)) {
      setError('Only JPG, PNG, and WEBP files are allowed.');
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB.');
      return;
    }
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  };

  const uploadToStorage = async (path: string): Promise<string | null> => {
    if (!file) return null;
    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      // `path` is kept for API compatibility with existing callers.
      // Cloudinary folder/public_id strategy is decided by backend.
      void path;
      setProgress(40);
      const { url, error } = await uploadImageFile(file);
      if (error || !url) {
        throw new Error(error || 'Upload failed');
      }
      setProgress(100);
      setUploadedUrl(url);
      setUploading(false);
      return url;
    } catch (err: any) {
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
