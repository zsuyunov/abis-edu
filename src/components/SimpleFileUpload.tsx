"use client";

import Image from "next/image";
import { useState, useRef } from "react";

interface SimpleFileUploadProps {
  onSuccess: (result: any) => void;
  onError?: (error: any) => void;
  accept?: string;
  label?: string;
}

const SimpleFileUpload = ({ 
  onSuccess, 
  onError, 
  accept = "image/*,.pdf,.doc,.docx",
  label = "Upload file"
}: SimpleFileUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      // Create a simple file object for now
      // In a real implementation, you would upload to your server or cloud service
      const fileUrl = URL.createObjectURL(file);
      
      const result = {
        fileId: Date.now().toString(),
        name: file.name,
        url: fileUrl,
        filePath: fileUrl,
        fileType: file.type,
        size: file.size
      };

      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSuccess(result);
    } catch (error) {
      console.error("Upload error:", error);
      if (onError) {
        onError(error);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div 
      className="text-xs text-gray-500 flex items-center gap-2 cursor-pointer p-2 border border-dashed border-gray-300 rounded-md hover:border-gray-400 hover:bg-gray-50"
      onClick={handleClick}
    >
      <Image src="/upload.png" alt="" width={28} height={28} />
      <span className="text-gray-700">
        {isUploading ? "Uploading..." : label}
      </span>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        disabled={isUploading}
      />
    </div>
  );
};

export default SimpleFileUpload;
