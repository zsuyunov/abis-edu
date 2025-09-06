"use client";

import { IKContext } from "imagekitio-react";
import { ReactNode } from "react";

interface ImageKitProviderProps {
  children: ReactNode;
}

const ImageKitProvider = ({ children }: ImageKitProviderProps) => {
  const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
  const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;

  if (!publicKey || !urlEndpoint) {
    console.error("ImageKit configuration missing. Please set NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY and NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT");
    return <>{children}</>;
  }

  return (
    <IKContext 
      publicKey={publicKey}
      urlEndpoint={urlEndpoint}
      authenticator={async () => {
        try {
          const response = await fetch("/api/imagekit-auth");
          if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
          }
          return await response.json();
        } catch (error) {
          console.error("Error fetching auth parameters:", error);
          throw error;
        }
      }}
    >
      {children}
    </IKContext>
  );
};

export default ImageKitProvider;
