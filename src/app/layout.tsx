import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ImageKitProvider from "@/components/ImageKitProvider";
import QueryProvider from "@/components/providers/QueryProvider";
import { LoadingProvider } from "@/components/providers/LoadingProvider";
import GlobalLoadingBar from "@/components/ui/GlobalLoadingBar";
import { TimetableCacheProvider } from "@/contexts/TimetableCacheContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ABIS EDU - School Management System",
  description: "ABIS EDU School Management System",
  icons: {
    icon: [
      { url: '/logo.png', type: 'image/png', sizes: '32x32' },
      { url: '/logo.png', type: 'image/png', sizes: '16x16' },
    ],
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo.png" type="image/png" sizes="32x32" />
        <link rel="icon" href="/logo.png" type="image/png" sizes="16x16" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body className={inter.className}>
        <QueryProvider>
          <TimetableCacheProvider>
            <LoadingProvider>
              <ImageKitProvider>
              <GlobalLoadingBar />
              {children} 
              <ToastContainer position="bottom-right" theme="dark" />
              </ImageKitProvider>
            </LoadingProvider>
          </TimetableCacheProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
