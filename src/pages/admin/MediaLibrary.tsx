import React, { useState, useEffect } from 'react';
import { collection, getDocs, setDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage, handleFirestoreError, OperationType } from '../../lib/firebase';
import { Upload, Trash2, Copy, Image as ImageIcon, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface MediaFile {
  id: string;
  url: string;
  name: string;
  size: number;
  type: string;
  createdAt: any;
}

interface MediaLibraryProps {
  onSelect?: (url: string) => void;
}

export const MediaLibrary: React.FC<MediaLibraryProps> = ({ onSelect }) => {
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      const q = query(collection(db, 'media_library'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedMedia = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MediaFile[];
      setMedia(fetchedMedia);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'media_library');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB.');
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error('Invalid file type. Use JPG, PNG, or WEBP.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to upload image");
      }

      const data = await response.json();
      if (!data.url) throw new Error("Invalid response from server");

      const fileId = Date.now().toString();
      
      const mediaData = {
        url: data.url,
        name: file.name,
        size: file.size,
        type: file.type,
        createdAt: serverTimestamp(),
        // Since we are not using Firebase Storage anymore, we can just save a placeholder
        storagePath: `cloudinary/${fileId}_${file.name}`
      };

      await setDoc(doc(db, 'media_library', fileId), mediaData);
      toast.success("Image uploaded successfully!");
      
      // Refresh media list
      fetchMedia();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload image.");
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleDelete = async (item: MediaFile) => {
    if (window.confirm('Are you sure you want to delete this media file?')) {
      try {
        // Delete from Storage if storagePath exists
        const data = item as any;
        if (data.storagePath) {
          const storageRef = ref(storage, data.storagePath);
          await deleteObject(storageRef);
        }
        
        // Delete from Firestore
        await deleteDoc(doc(db, 'media_library', item.id));
        setMedia(media.filter(m => m.id !== item.id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `media_library/${item.id}`);
      }
    }
  };

  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return <div className="text-slate-500">Loading media library...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Media Library</h1>
        <div>
          <input
            type="file"
            id="media-upload"
            className="hidden"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
          />
          <label
            htmlFor="media-upload"
            className={`flex items-center gap-2 px-4 py-2 bg-gray-100 shadow-neu-sm text-brand-primary hover:shadow-neu-pressed-sm rounded-xl transition-all cursor-pointer border-none ${
              uploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? 'Uploading...' : 'Upload Media'}
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {media.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 bg-gray-100 rounded-[2rem] shadow-neu-pressed-sm border-none">
            <ImageIcon className="w-12 h-12 mx-auto mb-3 text-slate-400" />
            <p>No media files found.</p>
            <p className="text-sm">Upload images to use in your articles.</p>
          </div>
        ) : (
          media.map((item) => (
            <div key={item.id} className="bg-gray-100 rounded-[2rem] shadow-neu border-none overflow-hidden group">
              <div className="aspect-square bg-gray-200 relative">
                <img src={item.url} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  {onSelect ? (
                    <button
                      onClick={() => onSelect(item.url)}
                      className="px-3 py-1.5 bg-brand-primary text-white rounded-md text-xs font-bold hover:bg-brand-primary/90 transition-colors"
                    >
                      Select
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleCopyUrl(item.url, item.id)}
                        className="p-2 bg-gray-100 shadow-neu rounded-full text-slate-700 hover:text-brand-primary hover:shadow-neu-pressed-sm transition-all"
                        title="Copy URL"
                      >
                        {copied === item.id ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        className="p-2 bg-gray-100 shadow-neu rounded-full text-red-600 hover:text-red-700 hover:shadow-neu-pressed-sm transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="p-3">
                <p className="text-sm font-medium text-slate-900 truncate" title={item.name}>{item.name}</p>
                <p className="text-xs text-slate-500 mt-1">{formatSize(item.size)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
