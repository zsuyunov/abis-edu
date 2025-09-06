import SupportAdmissionMenu from "@/components/SupportAdmissionMenu";
import Navbar from "@/components/Navbar";
import { LoadingProvider } from "@/components/providers/LoadingProvider";
import { ToastProvider } from "@/components/ui/Toast";
import QueryProvider from "@/components/providers/QueryProvider";
import PreloadRoutes from "@/components/PreloadRoutes";

import Image from "next/image";
import Link from "next/link";

export default function SupportAdmissionLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <QueryProvider>
      <LoadingProvider>
        <ToastProvider>
          <div className="h-screen flex">
            {/* LEFT SIDEBAR */}
            <div className="w-[14%] md:w-[8%] lg:w-[16%] xl:w-[14%] p-4 bg-white border-r border-purple-200">
              <Link
                href="/support-admission"
                className="flex items-center justify-center lg:justify-start gap-2"
              >
                <Image src="/logo.png" alt="logo" width={32} height={32} />
                <span className="hidden lg:block font-bold text-purple-700">Support Admission</span>
              </Link>
              <SupportAdmissionMenu />
            </div>
            {/* RIGHT CONTENT */}
            <div className="w-[86%] md:w-[92%] lg:w-[84%] xl:w-[86%] bg-gradient-to-br from-purple-50 to-indigo-50 overflow-scroll flex flex-col">
              <Navbar />
              {children}
            </div>
          </div>
          
          {/* Route Preloading */}
          <PreloadRoutes />
        
          {/* Ultra Fast Preloader removed for better performance */}
        </ToastProvider>
      </LoadingProvider>
    </QueryProvider>
  );
}
