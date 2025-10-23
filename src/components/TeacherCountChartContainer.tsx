import Image from "next/image";
import CountChart from "./CountChart";
import TeacherGenderIcons from "./TeacherGenderIcons";
import prisma, { withPrismaRetry } from "@/lib/prisma";

const TeacherCountChartContainer = async () => {
  let boys = 0;
  let girls = 0;

  // Skip database queries during static generation if no DATABASE_URL
  if ((process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production') && !process.env.DATABASE_URL) {
    return (
      <div className="bg-white rounded-xl w-full h-full p-4 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-semibold text-gray-800">Teachers</h1>
          <Image src="/moreDark.png" alt="" width={20} height={20} />
        </div>
        <div className="flex justify-center items-center h-32">
          <p className="text-gray-500">Data unavailable during build</p>
        </div>
      </div>
    );
  }

  try {
    const data = await withPrismaRetry(() =>
      prisma.teacher.groupBy({
        // In the new schema the field is named `gender`
        by: ["gender" as any],
        _count: true,
      } as any)
    );

    boys = (data as any[]).find((d) => (d.gender ?? d.sex) === "MALE")?._count || 0;
    girls = (data as any[]).find((d) => (d.gender ?? d.sex) === "FEMALE")?._count || 0;
  } catch (error) {
    console.error("Error fetching teacher gender data:", error);
    // Fallback to default values if database query fails
    boys = 0;
    girls = 0;
  }

  return (
    <div className="bg-white rounded-xl w-full h-full p-4 shadow-sm border border-gray-100">
      {/* TITLE */}
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-semibold text-gray-800">Teachers</h1>
        <Image src="/moreDark.png" alt="" width={20} height={20} />
      </div>
      {/* CHART */}
      <CountChart boys={boys} girls={girls} isTeacher={true} />
      {/* BOTTOM */}
      <div className="flex justify-center gap-16">
        <div className="flex flex-col gap-1">
          <div className="w-5 h-5 bg-purple-600 rounded-full" />
          <h1 className="font-bold text-gray-800">{boys}</h1>
          <h2 className="text-xs text-gray-500">
            Male ({boys + girls > 0 ? Math.round((boys / (boys + girls)) * 100) : 0}%)
          </h2>
        </div>
        <div className="flex flex-col gap-1">
          <div className="w-5 h-5 bg-blue-400 rounded-full" />
          <h1 className="font-bold text-gray-800">{girls}</h1>
          <h2 className="text-xs text-gray-500">
            Female ({boys + girls > 0 ? Math.round((girls / (boys + girls)) * 100) : 0}%)
          </h2>
        </div>
      </div>
    </div>
  );
};

export default TeacherCountChartContainer;
