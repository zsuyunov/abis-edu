import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";

const TimetableDetailPage = async ({ params }: { params: { id: string } }) => {
  const timetableId = parseInt(params.id);
  
  if (isNaN(timetableId)) {
    notFound();
  }

  const timetable = await prisma.timetable.findUnique({
    where: { id: timetableId },
    include: {
      branch: { select: { id: true, shortName: true, legalName: true } },
      class: { select: { id: true, name: true, capacity: true } },
      academicYear: { select: { id: true, name: true, startDate: true, endDate: true } },
      subject: { select: { id: true, name: true } },
      teacher: { 
        select: { 
          id: true, 
          firstName: true, 
          lastName: true,
          phone: true,
          email: true,
        } 
      },
      exams: {
        select: { 
          id: true, 
          name: true,
          date: true,
          startTime: true, 
          endTime: true 
        },
        orderBy: { date: "asc" }
      },
      attendances: {
        select: { 
          id: true, 
          date: true, 
          status: true, 
          student: { 
            select: { 
              firstName: true, 
              lastName: true,
              id: true
            } 
          } 
        },
        orderBy: { date: "desc" },
        take: 10, // Show recent 10 attendance records
      }
    },
  });

  if (!timetable) {
    notFound();
  }

  return (
    <div className="bg-white p-6 rounded-md flex-1 m-4 mt-0">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link 
            href="/admin/list/timetables" 
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <Image src="/close.png" alt="back" width={16} height={16} />
            <span>Back to Timetables</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Status Badge */}
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            timetable.status === "ACTIVE" 
              ? "bg-green-100 text-green-800" 
              : "bg-red-100 text-red-800"
          }`}>
            {timetable.status}
          </span>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Timetable Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Subject</label>
                <p className="text-lg font-semibold text-gray-900">{timetable.subject.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Teacher</label>
                <p className="text-lg font-semibold text-gray-900">
                  {timetable.teacher.firstName} {timetable.teacher.lastName}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Class</label>
                <p className="text-lg font-semibold text-gray-900">{timetable.class.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Branch</label>
                <p className="text-lg font-semibold text-gray-900">{timetable.branch.shortName}</p>
              </div>
            </div>
          </div>

          {/* Schedule Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Schedule Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Date</label>
                <p className="text-lg font-semibold text-gray-900">
                  {new Intl.DateTimeFormat("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }).format(new Date(timetable.fullDate))}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Time</label>
                <p className="text-lg font-semibold text-gray-900">
                  {new Intl.DateTimeFormat("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  }).format(new Date(timetable.startTime))} -{" "}
                  {new Intl.DateTimeFormat("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  }).format(new Date(timetable.endTime))}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Room Number</label>
                <p className="text-lg font-semibold text-gray-900">{timetable.roomNumber}</p>
              </div>
              {timetable.buildingName && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Building</label>
                  <p className="text-lg font-semibold text-gray-900">{timetable.buildingName}</p>
                </div>
              )}
            </div>
          </div>

          {/* Academic Year Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Academic Year</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Academic Year</label>
                <p className="text-lg font-semibold text-gray-900">{timetable.academicYear.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Duration</label>
                <p className="text-lg font-semibold text-gray-900">
                  {new Intl.DateTimeFormat("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }).format(new Date(timetable.academicYear.startDate))} -{" "}
                  {new Intl.DateTimeFormat("en-US", {
                    month: "short", 
                    day: "numeric",
                    year: "numeric",
                  }).format(new Date(timetable.academicYear.endDate))}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - Related Data */}
        <div className="space-y-6">
          {/* Teacher Contact */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-md font-semibold mb-3 text-blue-800">Teacher Contact</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-blue-600">Phone:</span>
                <p className="font-medium">{timetable.teacher.phone || "N/A"}</p>
              </div>
              <div>
                <span className="text-sm text-blue-600">Email:</span>
                <p className="font-medium">{timetable.teacher.email || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Exams */}
          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="text-md font-semibold mb-3 text-orange-800">
              Related Exams ({timetable.exams.length})
            </h3>
            {timetable.exams.length > 0 ? (
              <div className="space-y-2">
                {timetable.exams.map((exam) => (
                  <div key={exam.id} className="border-b border-orange-200 pb-2 last:border-b-0">
                    <p className="font-medium text-sm">{exam.name}</p>
                    <p className="text-xs text-orange-600">
                      {new Intl.DateTimeFormat("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }).format(new Date(exam.date))}
                      {" · "}
                      {exam.startTime} - {exam.endTime}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-orange-600">No exams scheduled</p>
            )}
          </div>

          {/* Recent Attendance */}
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-md font-semibold mb-3 text-purple-800">
              Recent Attendance ({timetable.attendances.length})
            </h3>
            {timetable.attendances.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {timetable.attendances.map((attendance) => (
                  <div key={attendance.id} className="border-b border-purple-200 pb-2 last:border-b-0">
                    <div className="flex justify-between items-center">
                      <p className="font-medium text-sm">
                        {attendance.student.firstName} {attendance.student.lastName}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded ${
                        attendance.status === "PRESENT"
                          ? "bg-green-100 text-green-800"
                          : attendance.status === "LATE"
                            ? "bg-yellow-100 text-yellow-800"
                            : attendance.status === "EXCUSED"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-red-100 text-red-800"
                      }`}>
                        {attendance.status}
                      </span>
                    </div>
                    <p className="text-xs text-purple-600">
                      {new Intl.DateTimeFormat("en-US", {
                        month: "short",
                        day: "numeric",
                      }).format(new Date(attendance.date))}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-purple-600">No attendance records</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimetableDetailPage;
