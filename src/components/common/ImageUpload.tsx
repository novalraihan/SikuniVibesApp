import React, { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { uploadImage } from '../../services/firebase/storage';
import imageCompression from 'browser-image-compression';
import { toast } from 'sonner';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  path: string;
  label?: string;
}

export function ImageUpload({ value, onChange, path, label = 'Unggah Gambar' }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar.');
      return;
    }

    try {
      setUploading(true);
      setError('');
      
      // Compress image
      const options = {
        maxSizeMB: 1, // Compress to max 1MB
        maxWidthOrHeight: 1920,
        useWebWorker: false,
      };
      
      const compressedFile = await imageCompression(file, options);
      
      const downloadUrl = await uploadImage(compressedFile, path);
      onChange(downloadUrl);
      toast.success('Gambar berhasil diunggah');
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengunggah gambar.');
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    onChange('');
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      
      {error && <p className="text-sm text-red-600">{error}</p>}

      {value ? (
        <div className="relative inline-block">
          <img 
            src={value} 
            alt="Uploaded preview" 
            className="h-40 w-auto rounded-lg object-cover border border-gray-200"
            referrerPolicy="no-referrer"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-2 -right-2 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
            title="Hapus gambar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div 
          className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? (
            <div className="flex flex-col items-center text-indigo-600">
              <Loader2 className="w-8 h-8 animate-spin mb-2" />
              <span className="text-sm font-medium">Mengunggah...</span>
            </div>
          ) : (
            <>
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-700">Klik untuk mengunggah gambar</span>
              <span className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 5MB</span>
            </>
          )}
        </div>
      )}
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
        disabled={uploading}
      />
    </div>
  );
}
