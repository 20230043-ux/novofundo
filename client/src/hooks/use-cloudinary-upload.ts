import { useState } from 'react';
import { apiRequest } from '@/lib/queryClient';

interface UploadOptions {
  folder?: string;
  publicId?: string;
}

interface UploadResult {
  url: string;
  publicId: string;
}

export function useCloudinaryUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadImage = async (
    file: File,
    options: UploadOptions = {}
  ): Promise<UploadResult> => {
    setUploading(true);
    setProgress(0);

    try {
      const reader = new FileReader();
      
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const base64Data = await base64Promise;
      setProgress(50);

      const response = await apiRequest('POST', '/api/upload/image', {
        image: base64Data,
        folder: options.folder || 'general',
        publicId: options.publicId,
      });

      const result = await response.json();
      setProgress(100);
      
      return result;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const uploadMultiple = async (
    files: File[],
    options: UploadOptions = {}
  ): Promise<UploadResult[]> => {
    const results: UploadResult[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const result = await uploadImage(files[i], options);
      results.push(result);
      setProgress(Math.round(((i + 1) / files.length) * 100));
    }
    
    return results;
  };

  return {
    uploadImage,
    uploadMultiple,
    uploading,
    progress,
  };
}
