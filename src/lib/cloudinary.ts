/**
 * Reusable utility for Cloudinary Unsigned Uploads.
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

interface UploadResponse {
  secure_url: string;
  public_id: string;
  bytes: number;
  width: number;
  height: number;
  format: string;
}

import { CloudinaryImage } from './types';

export async function compressImage(file: File | Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (file.size <= 2 * 1024 * 1024) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas'); // Resize down for faster uploads
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
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
          if (!blob) {
            reject(new Error('Canvas compression failed'));
            return;
          }
          if (blob.size > 5 * 1024 * 1024) {
             reject(new Error('Please use a smaller image (max 5MB)'));
          } else {
             resolve(blob);
          }
        }, 'image/jpeg', 0.6); // aggressive compression to stay under quotas
      };
      img.onerror = () => reject(new Error('Failed to load image'));
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
  });
}

/**
 * Uploads an image file to Cloudinary using the unsigned upload preset.
 * @param file The file to upload
 * @param onProgress Optional callback for upload progress
 * @returns {Promise<CloudinaryImage>} The secure URL and public ID of the uploaded image
 */
export async function uploadToCloudinary(
  file: File | Blob,
  onProgress?: (progress: number) => void
): Promise<CloudinaryImage> {
  const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    const errorMsg = `Cloudinary config missing: CLOUD_NAME=${CLOUD_NAME || 'missing'}, UPLOAD_PRESET=${UPLOAD_PRESET || 'missing'}. Please check your environment variables (\`.env\`).`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  // Compress image before uploading
  const compressedFile = await compressImage(file);

  const formData = new FormData();
  formData.append('file', compressedFile, (file as File).name || 'upload.jpg');
  formData.append('upload_preset', UPLOAD_PRESET);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress(progress);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response: UploadResponse = JSON.parse(xhr.responseText);
          console.log('✅ Cloudinary upload successful:', response.secure_url);
          resolve({
            url: response.secure_url,
            publicId: response.public_id
          });
        } catch (e) {
          console.error('❌ Failed to parse Cloudinary response:', xhr.responseText);
          reject(new Error('Failed to parse Cloudinary response.'));
        }
      } else {
        const errorMsg = `Cloudinary upload failed (Status ${xhr.status}): ${xhr.responseText}`;
        console.error('❌ ' + errorMsg);
        reject(new Error(errorMsg));
      }
    };

    xhr.onerror = () => {
      console.error('❌ Network error occurred during Cloudinary upload.');
      reject(new Error('Network error occurred during upload.'));
    };

    xhr.send(formData);
  });
}
