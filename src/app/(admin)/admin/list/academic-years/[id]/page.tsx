import prisma from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { calculateAcademicYearProgress, formatDays } from "@/lib/academicYearUtils";

const AcademicYearDetailsPage = async ({
  params: { id },
}: {
  params: { id: string };
}) => {
  const academicYear = await prisma.academicYear.findUnique({
    where: { id: parseInt(id) },
    include: { semesters: { orderBy: { startDate: "asc" } } },
  });

  if (!academicYear) {
    return (
      <div className="bg-white p-4 rounded-md m-4">
        <h1 className="text-lg font-semibold">Academic Year Not Found</h1>
        <Link href="/admin/list/academic-years" className="text-blue-600 text-sm">Back to list</Link>
      </div>
    );
  }

  // Calculate academic year progress
  const progress = calculateAcademicYearProgress(
    academicYear.startDate,
    academicYear.endDate
  );

  return (
    <div className="bg-white p-4 rounded-md m-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">{academicYear.name}</h1>
        <Link href="/admin/list/academic-years">
          <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSky" title="Back">
            <Image src="/back.png" alt="" width={16} height={16} />
          </button>
        </Link>
      </div>

      {/* Academic Year Progress Calculator */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-4">Academic Year Progress</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{progress.daysPassed}</div>
            <div className="text-sm text-blue-700">Days Passed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{progress.daysRemaining}</div>
            <div className="text-sm text-green-700">Days Remaining</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{progress.totalDays}</div>
            <div className="text-sm text-purple-700">Total Days</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{progress.progressPercentage}%</div>
            <div className="text-sm text-orange-700">Progress</div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${
              progress.isOverdue 
                ? 'bg-red-500' 
                : progress.progressPercentage > 80 
                  ? 'bg-orange-500' 
                  : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min(progress.progressPercentage, 100)}%` }}
          ></div>
        </div>
        
        <div className="text-center text-sm text-gray-600">
          {progress.isOverdue ? (
            <span className="text-red-600 font-medium">
              ⚠️ Academic year ended {formatDays(-progress.daysRemaining)} ago
            </span>
          ) : progress.progressPercentage > 80 ? (
            <span className="text-orange-600 font-medium">
              🎯 Academic year ending soon - {formatDays(progress.daysRemaining)} left
            </span>
          ) : (
            <span className="text-blue-600 font-medium">
              📚 Academic year in progress - {formatDays(progress.daysRemaining)} remaining
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-6">
        <div>
          <p className="text-gray-500">Start Date</p>
          <p className="font-medium">{new Date(academicYear.startDate).toLocaleDateString()}</p>
        </div>
        <div>
          <p className="text-gray-500">End Date</p>
          <p className="font-medium">{new Date(academicYear.endDate).toLocaleDateString()}</p>
        </div>
        <div>
          <p className="text-gray-500">Status</p>
          <p className="font-medium">{academicYear.status}</p>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-md font-semibold mb-2">Semesters ({academicYear.semesters.length})</h2>
        {academicYear.semesters.length === 0 ? (
          <p className="text-sm text-gray-500">No semesters</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {academicYear.semesters.map((s) => (
              <div key={s.id} className="border rounded-md p-3">
                <p className="font-medium text-sm">{s.name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(s.startDate).toLocaleDateString()} - {new Date(s.endDate).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AcademicYearDetailsPage;


