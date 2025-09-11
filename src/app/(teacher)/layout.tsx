import TeacherBottomNav from "@/components/TeacherBottomNav";
import Navbar from "@/components/Navbar";
import LanguageSelector from "@/components/LanguageSelector";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Image from "next/image";
import Link from "next/link";

export default function TeacherLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <LanguageProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* TOP HEADER */}
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-200/50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo and Brand */}
              <Link
                href="/teacher"
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <div className="relative">
                  <Image 
                    src="/logo.png" 
                    alt="logo" 
                    width={32} 
                    height={32} 
                    className="rounded-xl shadow-sm" 
                  />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <div className="hidden sm:block">
                  <h1 className="font-bold text-lg text-gray-900">ABIS Teacher</h1>
                  <p className="text-xs text-gray-500 -mt-1">Portal</p>
                </div>
              </Link>

              {/* Right side controls */}
              <div className="flex items-center gap-3">
                <LanguageSelector />
                <Navbar />
              </div>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="pb-20 min-h-[calc(100vh-4rem)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </div>

        {/* BOTTOM NAVIGATION */}
        <TeacherBottomNav />
      </div>
    </LanguageProvider>
  );
}
