import { useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';

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
    if (!selectedFile.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB.');
      return;
    }
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  };

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas compression failed'));
          }, 'image/jpeg', 0.8);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
    });
  };

  const uploadToStorage = async (path: string): Promise<string | null> => {
    if (!file) return null;
    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      const compressedBlob = await compressImage(file);
      const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, compressedBlob);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const currentProgress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setProgress(currentProgress);
          },
          (err) => {
            setError(err.message || 'Upload failed');
            setUploading(false);
            reject(err);
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            setUploadedUrl(downloadURL);
            setUploading(false);
            setProgress(100);
            resolve(downloadURL);
          }
        );
      });
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
