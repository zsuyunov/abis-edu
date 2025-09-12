import { useState, useCallback } from "react";

interface UploadedFile {
  id: string;
  name: string;
  url: string;
  thumbnailUrl?: string;
  filePath: string;
  size: number;
  fileType: string;
  originalName: string;
  uploadedAt: string;
}

interface UseImageKitUploadReturn {
  uploadFile: (file: File, type: 'image' | 'document' | 'audio', folder?: string) => Promise<UploadedFile>;
  uploading: boolean;
  progress: number;
  error: string | null;
}

export const useImageKitUpload = (): UseImageKitUploadReturn => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(async (
    file: File, 
    type: 'image' | 'document' | 'audio', 
    folder: string = 'homework'
  ): Promise<UploadedFile> => {
    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      formData.append('folder', folder);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const xhr = new XMLHttpRequest();
      
      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            setProgress(Math.round(percentComplete));
          }
        });

        xhr.addEventListener('load', () => {
          setUploading(false);
          setProgress(100);

          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            if (response.success) {
              resolve(response.file);
            } else {
              reject(new Error(response.error || 'Upload failed'));
            }
          } else {
            const errorResponse = JSON.parse(xhr.responseText);
            reject(new Error(errorResponse.error || 'Upload failed'));
          }
        });

        xhr.addEventListener('error', () => {
          setUploading(false);
          reject(new Error('Network error during upload'));
        });

        xhr.open('POST', '/api/imagekit/upload');
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(formData);
      });
    } catch (err) {
      setUploading(false);
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  return {
    uploadFile,
    uploading,
    progress,
    error,
  };
};
