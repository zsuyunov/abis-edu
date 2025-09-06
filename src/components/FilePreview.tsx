"use client";

import { useState } from "react";
import Image from "next/image";

interface FilePreviewProps {
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  onClose: () => void;
  onDownload?: () => void;
}

const FilePreview = ({ fileName, filePath, fileType, fileSize, onClose, onDownload }: FilePreviewProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

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

  const isImage = fileType.startsWith('image/');
  const isPDF = fileType.includes('pdf');
  const isPreviewable = isImage || isPDF;

  const handleLoad = () => {
    setLoading(false);
  };

  const handleError = () => {
    setLoading(false);
    setError("Failed to load file preview");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Image 
              src={getFileIcon(fileType)} 
              alt="file type" 
              width={24} 
              height={24} 
            />
            <div>
              <h3 className="font-semibold text-gray-900 truncate max-w-md">
                {fileName}
              </h3>
              <p className="text-sm text-gray-500">
                {fileType.split('/')[1]?.toUpperCase() || 'FILE'} • {formatFileSize(fileSize)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {onDownload && (
              <button
                onClick={onDownload}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
              >
                <Image src="/download.png" alt="download" width={16} height={16} />
                <span>Download</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <Image src="/close.png" alt="close" width={20} height={20} />
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-auto bg-gray-50">
          {loading && isPreviewable && (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
                <p className="text-sm text-gray-600">Loading preview...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Image src="/error.png" alt="error" width={48} height={48} className="mx-auto mb-3" />
                <p className="text-sm text-red-600 mb-2">{error}</p>
                <p className="text-xs text-gray-500">You can still download the file</p>
              </div>
            </div>
          )}

          {!isPreviewable && !loading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Image 
                  src={getFileIcon(fileType)} 
                  alt="file type" 
                  width={64} 
                  height={64} 
                  className="mx-auto mb-4"
                />
                <h4 className="font-medium text-gray-900 mb-2">{fileName}</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Preview not available for this file type
                </p>
                <p className="text-xs text-gray-500">
                  Supported preview formats: PDF, JPG, PNG, GIF
                </p>
                {onDownload && (
                  <button
                    onClick={onDownload}
                    className="mt-4 flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 mx-auto"
                  >
                    <Image src="/download.png" alt="download" width={16} height={16} />
                    <span>Download File</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Image Preview */}
          {isImage && (
            <div className="p-4">
              <div className="flex justify-center">
                <Image
                  src={filePath}
                  alt={fileName}
                  width={800}
                  height={600}
                  className="max-w-full h-auto rounded-lg shadow-lg"
                  onLoad={handleLoad}
                  onError={handleError}
                  style={{ maxHeight: '70vh', objectFit: 'contain' }}
                />
              </div>
            </div>
          )}

          {/* PDF Preview */}
          {isPDF && (
            <div className="h-full">
              <iframe
                src={`${filePath}#toolbar=1&navpanes=1&scrollbar=1`}
                className="w-full h-full min-h-[600px]"
                onLoad={handleLoad}
                onError={handleError}
                title={fileName}
              />
            </div>
          )}
        </div>

        {/* Footer with file info */}
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4 text-gray-600">
              <span>File size: {formatFileSize(fileSize)}</span>
              <span>Type: {fileType}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              {isPreviewable && (
                <span className="text-green-600 text-xs">
                  ✓ Preview available
                </span>
              )}
              <span className="text-xs text-gray-500">
                Press ESC to close
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilePreview;
