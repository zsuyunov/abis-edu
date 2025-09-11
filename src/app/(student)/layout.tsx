import StudentBottomNavigation from "@/components/StudentBottomNavigation";
import Navbar from "@/components/Navbar";
import LanguageSelector from "@/components/LanguageSelector";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Image from "next/image";
import Link from "next/link";

export default function StudentLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <LanguageProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
        {/* TOP HEADER */}
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-200/50 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            {/* Logo */}
            <Link
              href="/student"
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Image src="/logo.png" alt="logo" width={20} height={20} className="rounded-sm" />
              </div>
              <span className="font-bold text-gray-900 text-lg">Student Portal</span>
            </Link>
            
            {/* Header Actions */}
            <div className="flex items-center gap-3">
              <LanguageSelector />
              <Navbar />
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="pb-20 px-4 py-6 max-w-7xl mx-auto">
          {children}
        </div>

        {/* BOTTOM NAVIGATION */}
        <StudentBottomNavigation />
      </div>
    </LanguageProvider>
  );
}
