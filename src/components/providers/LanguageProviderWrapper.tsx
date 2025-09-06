"use client";

import { LanguageProvider } from "@/contexts/LanguageContext";

interface LanguageProviderWrapperProps {
  children: React.ReactNode;
}

export default function LanguageProviderWrapper({ children }: LanguageProviderWrapperProps) {
  return (
    <LanguageProvider>
      {children}
    </LanguageProvider>
  );
}
