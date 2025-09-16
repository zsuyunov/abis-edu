import AdminMenu from "@/components/AdminMenu";
import Navbar from "@/components/Navbar";
import { LoadingProvider } from "@/components/providers/LoadingProvider";
import { ToastProvider } from "@/components/ui/Toast";
import QueryProvider from "@/components/providers/QueryProvider";
import PreloadRoutes from "@/components/PreloadRoutes";
import { LanguageProvider } from "@/contexts/LanguageContext";

import Image from "next/image";
import Link from "next/link";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <QueryProvider>
      <LoadingProvider>
        <ToastProvider>
          <LanguageProvider>
            <div className="h-screen flex overflow-hidden">
              {/* LEFT SIDEBAR */}
              <div className="w-[14%] md:w-[8%] lg:w-[16%] xl:w-[14%] flex flex-col bg-black border-r border-gray-800">
                <div className="p-4">
                  <Link
                    href="/admin"
                    className="flex items-center justify-center lg:justify-start gap-2"
                  >
                    <Image src="/logo.png" alt="logo" width={32} height={32} className="rounded-lg" />
                    <span className="hidden lg:block font-bold text-white">ABIS Admin</span>
                  </Link>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <AdminMenu />
                </div>
              </div>
              {/* RIGHT CONTENT */}
              <div className="w-[86%] md:w-[92%] lg:w-[84%] xl:w-[86%] bg-gray-50 overflow-scroll flex flex-col">
                <Navbar />
                {children}
              </div>
            </div>
            
            {/* Route Preloading */}
            <PreloadRoutes />
            
            {/* Ultra Fast Preloader removed for better performance */}
          </LanguageProvider>
        </ToastProvider>
      </LoadingProvider>
    </QueryProvider>
  );
}
