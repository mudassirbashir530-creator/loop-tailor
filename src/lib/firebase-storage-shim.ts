// src/lib/firebase-storage-shim.ts
import { uploadToCloudinary } from './cloudinary';

export const storage = { type: 'storage' };

export function getStorage() {
  return storage;
}

export function ref(storageInstance: any, path: string) {
  return {
    type: 'storage-ref',
    path,
    file: null as File | null,
    downloadUrl: null as string | null
  };
}

export async function uploadBytes(storageRef: any, file: File | Blob) {
  try {
    console.log(`[Storage Shim] Intercepted upload and redirecting to Cloudinary: ${storageRef.path}`);
    const cloudinaryResponse = await uploadToCloudinary(file);
    storageRef.downloadUrl = cloudinaryResponse.url;
    console.log(`[Storage Shim] Uploaded to Cloudinary successfully: ${cloudinaryResponse.url}`);
    return { ref: storageRef };
  } catch (err) {
    console.error(`[Storage Shim] Cloudinary upload failed:`, err);
    throw err;
  }
}

export async function getDownloadURL(storageRef: any) {
  if (storageRef.downloadUrl) {
    return storageRef.downloadUrl;
  }
  // Fallback
  return '';
}

export async function deleteObject(storageRef: any) {
  console.log(`[Storage Shim] Delete object requested for: ${storageRef.path}`);
}
