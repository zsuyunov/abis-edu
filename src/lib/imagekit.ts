import ImageKit from "imagekit";

// ImageKit configuration
const imagekit = new ImageKit({
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!,
});

export default imagekit;

// Client-side ImageKit configuration
export const imagekitConfig = {
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!,
  authenticationEndpoint: "/api/imagekit/auth",
};

// Helper function to generate ImageKit URL with transformations
export const getImageKitUrl = (
  filePath: string,
  transformations?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: string;
    crop?: string;
    focus?: string;
  }
) => {
  if (!filePath) return "";
  
  const baseUrl = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!;
  let url = `${baseUrl}/${filePath}`;
  
  if (transformations) {
    const params = new URLSearchParams();
    
    if (transformations.width) params.append("tr", `w-${transformations.width}`);
    if (transformations.height) params.append("tr", `h-${transformations.height}`);
    if (transformations.quality) params.append("tr", `q-${transformations.quality}`);
    if (transformations.format) params.append("tr", `f-${transformations.format}`);
    if (transformations.crop) params.append("tr", `c-${transformations.crop}`);
    if (transformations.focus) params.append("tr", `fo-${transformations.focus}`);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
  }
  
  return url;
};

// File type validation
export const validateFileType = (file: File, allowedTypes: string[]) => {
  return allowedTypes.some(type => {
    if (type.includes('*')) {
      const baseType = type.split('/')[0];
      return file.type.startsWith(baseType);
    }
    return file.type === type;
  });
};

// File size validation (in MB)
export const validateFileSize = (file: File, maxSizeMB: number) => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

// Generate unique filename
export const generateUniqueFileName = (originalName: string, prefix?: string) => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop();
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, "");
  
  return `${prefix ? prefix + '_' : ''}${nameWithoutExt}_${timestamp}_${random}.${extension}`;
};
