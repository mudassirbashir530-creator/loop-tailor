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
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error('Cloudinary configuration is missing. Check your environment variables.');
  }

  // Pre-compression/resize could be added here if needed using a library or Canvas

  const formData = new FormData();
  formData.append('file', file);
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
          resolve({
            url: response.secure_url,
            publicId: response.public_id
          });
        } catch (e) {
          reject(new Error('Failed to parse Cloudinary response.'));
        }
      } else {
        const errorMsg = `Upload failed with status ${xhr.status}: ${xhr.statusText}`;
        console.error(errorMsg, xhr.responseText);
        reject(new Error(errorMsg));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error occurred during upload.'));
    };

    xhr.send(formData);
  });
}
