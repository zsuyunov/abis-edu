"use client";

import { IKUpload } from "imagekitio-react";
import Image from "next/image";
import { useState } from "react";

interface ImageKitUploadProps {
  onSuccess: (result: any) => void;
  onError?: (error: any) => void;
}

const ImageKitUpload = ({ onSuccess, onError }: ImageKitUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleSuccess = (result: any) => {
    setIsUploading(false);
    onSuccess(result);
  };

  const handleError = (error: any) => {
    setIsUploading(false);
    if (onError) {
      onError(error);
    }
    console.error("Upload error:", error);
  };

  const handleUploadStart = () => {
    setIsUploading(true);
  };

  return (
    <div className="text-xs text-gray-500 flex items-center gap-2">
      <div className="relative inline-flex items-center gap-2 cursor-pointer select-none">
        <Image src="/upload.png" alt="" width={28} height={28} />
        <span>{isUploading ? "Uploading..." : "Upload a file"}</span>
        <IKUpload
          fileName="user-file"
          folder="/school-users"
          onError={handleError}
          onSuccess={handleSuccess}
          onUploadStart={handleUploadStart}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            opacity: 0,
            width: "100%",
            height: "100%",
            cursor: "pointer",
          }}
        />
      </div>
    </div>
  );
};

export default ImageKitUpload;
