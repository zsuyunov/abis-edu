import SupportDirectorMenu from "@/components/SupportDirectorMenu";
import Navbar from "@/components/Navbar";
import { LoadingProvider } from "@/components/providers/LoadingProvider";
import { ToastProvider } from "@/components/ui/Toast";
import QueryProvider from "@/components/providers/QueryProvider";
import Image from "next/image";
import Link from "next/link";

export default function SupportDirectorLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <QueryProvider>
      <LoadingProvider>
        <ToastProvider>
          <div className="h-screen flex">
            <div className="w-[14%] md:w-[8%] lg:w-[16%] xl:w-[14%] p-4 bg-white border-r border-gray-200">
              <Link href="/support-director" className="flex items-center justify-center lg:justify-start gap-2">
                <Image src="/logo.png" alt="logo" width={32} height={32} />
                <span className="hidden lg:block font-bold text-gray-800">Support Director</span>
              </Link>
              <SupportDirectorMenu />
            </div>
            <div className="w-[86%] md:w-[92%] lg:w-[84%] xl:w-[86%] bg-[#F7F8FA] overflow-scroll flex flex-col">
              <Navbar />
              {children}
            </div>
          </div>
        </ToastProvider>
      </LoadingProvider>
    </QueryProvider>
  );
}


