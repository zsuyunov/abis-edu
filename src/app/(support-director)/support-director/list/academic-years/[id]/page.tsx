import prisma from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { calculateAcademicYearProgress, formatDays } from "@/lib/academicYearUtils";

const AcademicYearDetailsPage = async ({
  params: { id },
}: {
  params: { id: string };
}) => {
  const headersList = headers();
  const role = headersList.get("x-user-role");
  const branchIdHeader = headersList.get("x-branch-id");

  if (role !== "support_director") {
    return (
      <div className="bg-white p-4 rounded-md m-4">
        <h1 className="text-lg font-semibold text-red-600">Access Denied</h1>
        <p className="text-gray-600">You don't have permission to view this page.</p>
      </div>
    );
  }

  const branchId = Number(branchIdHeader);
  if (!branchId) {
    return (
      <div className="bg-white p-4 rounded-md m-4">
        <h1 className="text-lg font-semibold text-red-600">Branch Not Assigned</h1>
        <p className="text-gray-600">Please contact your administrator to assign you to a branch.</p>
      </div>
    );
  }

  const academicYear = await prisma.academicYear.findUnique({
    where: { id: parseInt(id) },
    include: { 
      semesters: { orderBy: { startDate: "asc" } },
      classes: {
        where: { branchId },
        include: {
          branch: { select: { shortName: true } },
          supervisor: { select: { firstName: true, lastName: true, teacherId: true } },
          _count: { select: { students: true } }
        }
      }
    },
  });

  // Calculate academic year progress
  const progress = calculateAcademicYearProgress(
    academicYear.startDate,
    academicYear.endDate
  );

  if (!academicYear) {
    return (
      <div className="bg-white p-4 rounded-md m-4">
        <h1 className="text-lg font-semibold">Academic Year Not Found</h1>
        <Link href="/support-director/list/academic-years" className="text-blue-600 text-sm">Back to list</Link>
      </div>
    );
  }

  // Check if this academic year has classes in the user's branch
  if (academicYear.classes.length === 0) {
    return (
      <div className="bg-white p-4 rounded-md m-4">
        <h1 className="text-lg font-semibold">No Access</h1>
        <p className="text-gray-600">This academic year has no classes in your branch.</p>
        <Link href="/support-director/list/academic-years" className="text-blue-600 text-sm">Back to list</Link>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-md m-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">{academicYear.name}</h1>
        <Link href="/support-director/list/academic-years">
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
                  ? 'bg-blue-500' 
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
            <span className="text-red-600 font-medium">
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

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Semesters</h2>
        {academicYear.semesters.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {academicYear.semesters.map((semester) => (
              <div key={semester.id} className="border border-gray-200 rounded-lg p-3">
                <h3 className="font-medium text-gray-900">{semester.name}</h3>
                <div className="text-sm text-gray-600 mt-1">
                  <p>Start: {new Date(semester.startDate).toLocaleDateString()}</p>
                  <p>End: {new Date(semester.endDate).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No semesters defined for this academic year.</p>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Classes in Your Branch</h2>
        {academicYear.classes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supervisor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {academicYear.classes.map((cls) => (
                  <tr key={cls.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {cls.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cls.supervisor ? (
                        <div>
                          <div>{cls.supervisor.firstName} {cls.supervisor.lastName}</div>
                          <div className="text-xs text-gray-500">ID: {cls.supervisor.teacherId}</div>
                        </div>
                      ) : (
                        <span className="text-red-500">No supervisor assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cls._count.students}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        cls.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {cls.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No classes found for this academic year in your branch.</p>
        )}
      </div>
    </div>
  );
};

export default AcademicYearDetailsPage;
