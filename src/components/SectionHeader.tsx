"use client";

import { useSectionColor } from "@/hooks/useSectionColor";

const SectionHeader = ({ 
  title, 
  subtitle,
  children 
}: { 
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) => {
  const sectionColor = useSectionColor();

  return (
    <div className={`bg-gradient-to-r ${sectionColor.gradient} text-white p-6 rounded-lg mb-4 shadow-md`}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle && (
            <p className="text-white/80 mt-1">{subtitle}</p>
          )}
        </div>
        {children && (
          <div className="flex items-center gap-4">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

export default SectionHeader;
