"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import Image from "next/image";

interface FileUploadProps {
  onFileSelect: (file: File, fileData: {
    fileName: string;
    filePath: string;
    fileType: string;
    fileSize: number;
  }) => void;
  acceptedTypes?: string[];
  maxSize?: number; // in MB
  currentFile?: {
    fileName: string;
    fileSize: number;
    fileType: string;
  };
  disabled?: boolean;
}

const FileUpload = ({ 
  onFileSelect, 
  acceptedTypes = ["pdf", "doc", "docx", "jpg", "jpeg", "png", "gif"], 
  maxSize = 10,
  currentFile,
  disabled = false
}: FileUploadProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file size
    const sizeInMB = file.size / (1024 * 1024);
    if (sizeInMB > maxSize) {
      return `File size must be less than ${maxSize}MB`;
    }

    // Check file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !acceptedTypes.includes(fileExtension)) {
      return `File type must be one of: ${acceptedTypes.join(', ')}`;
    }

    return null;
  };

  const simulateUpload = async (file: File): Promise<{ filePath: string }> => {
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // In a real implementation, this would upload to your storage service
    // For now, we'll create a mock file path
    const timestamp = Date.now();
    const fileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `/uploads/documents/${timestamp}_${fileName}`;
    
    return { filePath };
  };

  const handleFile = async (file: File) => {
    setError("");
    
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setUploading(true);
    
    try {
      const { filePath } = await simulateUpload(file);
      
      const fileData = {
        fileName: file.name,
        filePath: filePath,
        fileType: file.type || `application/${file.name.split('.').pop()}`,
        fileSize: file.size,
      };

      onFileSelect(file, fileData);
    } catch (error) {
      setError("Failed to upload file. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    if (disabled || uploading) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled && !uploading) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleClick = () => {
    if (!disabled && !uploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '/pdf.png';
    if (fileType.includes('word') || fileType.includes('document')) return '/doc.png';
    if (fileType.includes('image')) return '/image.png';
    return '/file.png';
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileInput}
        accept={acceptedTypes.map(type => `.${type}`).join(',')}
        className="hidden"
        disabled={disabled || uploading}
      />
      
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragOver 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : ''}
          ${currentFile ? 'bg-green-50 border-green-300' : ''}
        `}
      >
        {uploading ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
            <p className="text-sm text-gray-600">Uploading file...</p>
          </div>
        ) : currentFile ? (
          <div className="flex flex-col items-center">
            <Image 
              src={getFileIcon(currentFile.fileType)} 
              alt="file" 
              width={32} 
              height={32} 
              className="mb-3"
            />
            <p className="font-medium text-gray-900">{currentFile.fileName}</p>
            <p className="text-sm text-gray-500">{formatFileSize(currentFile.fileSize)}</p>
            <p className="text-xs text-green-600 mt-2">✓ File uploaded successfully</p>
            <p className="text-xs text-gray-500 mt-1">Click to replace file</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Image src="/upload.png" alt="upload" width={32} height={32} className="mb-3" />
            <p className="text-lg font-medium text-gray-900 mb-1">
              Drop your file here, or <span className="text-blue-600">browse</span>
            </p>
            <p className="text-sm text-gray-500 mb-3">
              Supports: {acceptedTypes.join(', ').toUpperCase()}
            </p>
            <p className="text-xs text-gray-400">
              Maximum file size: {maxSize}MB
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
          {error}
        </div>
      )}

      {/* File type info */}
      <div className="mt-3 text-xs text-gray-500">
        <p><strong>Accepted formats:</strong></p>
        <div className="flex flex-wrap gap-2 mt-1">
          <span className="px-2 py-1 bg-gray-100 rounded">PDF documents</span>
          <span className="px-2 py-1 bg-gray-100 rounded">Word documents (.doc, .docx)</span>
          <span className="px-2 py-1 bg-gray-100 rounded">Images (.jpg, .png, .gif)</span>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
