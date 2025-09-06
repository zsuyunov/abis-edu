import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ImageKitProvider from "@/components/ImageKitProvider";
import QueryProvider from "@/components/providers/QueryProvider";
import { LoadingProvider } from "@/components/providers/LoadingProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Lama Dev School Management Dashboard",
  description: "Next.js School Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          <ImageKitProvider>
            <LoadingProvider>
              {children} <ToastContainer position="bottom-right" theme="dark" />
            </LoadingProvider>
          </ImageKitProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
