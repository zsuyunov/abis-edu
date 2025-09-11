import Announcements from "@/components/Announcements";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import FormContainer from "@/components/FormContainer";
import Performance from "@/components/Performance";
import StudentAttendanceCard from "@/components/StudentAttendanceCard";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { Branch, Class, Parent, Student, StudentAttachment } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

type StudentWithDetails = Student & {
  class: (Class & { 
    _count: { timetables: number };
    branch: Branch;
  }) | null;
  studentParents: {
    parent: Parent;
  }[];
  branch: Branch | null;
  attachments: StudentAttachment[];
};

const SingleStudentPage = async ({
  params: { id },
}: {
  params: { id: string };
}) => {
  const headersList = headers();
  const role = headersList.get("x-user-role");

  const student: StudentWithDetails | null = await prisma.student.findUnique({
    where: { id },
    include: {
      class: { 
        include: { 
          _count: { select: { timetables: true } },
          branch: true,
        } 
      },
      studentParents: {
        include: {
          parent: true,
        },
      },
      branch: true,
      attachments: true,
    },
  });

  if (!student) {
    return notFound();
  }

  return (
    <div className="flex-1 p-4 flex flex-col gap-4 xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3">
        {/* TOP */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* USER INFO CARD */}
          <div className="bg-lamaSky py-6 px-4 rounded-md flex-1 flex gap-4">
            <div className="w-1/3">
              <Image
                src="/noAvatar.png"
                alt=""
                width={144}
                height={144}
                className="w-36 h-36 rounded-full object-cover"
              />
            </div>
            <div className="w-2/3 flex flex-col justify-between gap-4">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold">
                  {student.firstName} {student.lastName}
                </h1>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    student.status === "ACTIVE"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {student.status}
                </span>
                {role === "admin" && (
                  <FormContainer table="student" type="update" data={student} />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Student ID:</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                    {student.studentId}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Gender:</span>
                  <span className="text-sm text-gray-600">{student.gender}</span>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-medium">
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/date.png" alt="" width={14} height={14} />
                  <span>
                    {student.dateOfBirth ? new Intl.DateTimeFormat("en-GB").format(student.dateOfBirth) : 'Not provided'}
                  </span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/phone.png" alt="" width={14} height={14} />
                  <span>{student.phone}</span>
                </div>
              </div>
            </div>
          </div>
          {/* SMALL CARDS */}
          <div className="flex-1 flex gap-4 justify-between flex-wrap">
            {/* ATTENDANCE CARD */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image
                src="/singleAttendance.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <Suspense fallback="loading...">
                <StudentAttendanceCard id={student.id} />
              </Suspense>
            </div>
            {/* BRANCH CARD */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image
                src="/singleBranch.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div className="">
                <h1 className="text-xl font-semibold">
                  {student.branch?.shortName || 'Not assigned'}
                </h1>
                <span className="text-sm text-gray-400">Branch</span>
              </div>
            </div>
            {/* LESSONS CARD */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image
                src="/singleLesson.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div className="">
                <h1 className="text-xl font-semibold">
                  {student.class?._count.timetables || 0}
                </h1>
                <span className="text-sm text-gray-400">Lessons</span>
              </div>
            </div>
            {/* CLASS CARD */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image
                src="/singleClass.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div className="">
                <h1 className="text-xl font-semibold">{student.class?.name || 'Not assigned'}</h1>
                <span className="text-sm text-gray-400">Class</span>
              </div>
            </div>
          </div>
        </div>

        {/* PARENT INFORMATION */}
        <div className="mt-4 bg-white rounded-md p-4">
          <h1 className="text-lg font-semibold mb-4">Parent Information</h1>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Parent Name:</span>
                  <span className="text-sm text-gray-600">
                    {student.studentParents.length > 0 
                      ? `${student.studentParents[0].parent.firstName} ${student.studentParents[0].parent.lastName}`
                      : 'No parent assigned'
                    }
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Parent ID:</span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                    {student.studentParents.length > 0 
                      ? student.studentParents[0].parent.parentId
                      : 'N/A'
                    }
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Contact:</span>
                  <span className="text-sm text-gray-600">
                    {student.studentParents.length > 0 
                      ? student.studentParents[0].parent.phone
                      : 'N/A'
                    }
                  </span>
                </div>
              </div>
            </div>
            {student.studentParents.length > 0 ? (
              <Link
                href={`/admin/list/parents/${student.studentParents[0].parent.id}`}
                className="px-3 py-2 bg-purple-100 text-purple-800 rounded-md text-sm hover:bg-purple-200"
              >
                View Parent Profile
              </Link>
            ) : (
              <span className="px-3 py-2 bg-gray-100 text-gray-500 rounded-md text-sm">
                No Parent Profile
              </span>
            )}
          </div>
        </div>

        {/* ACADEMIC INFORMATION */}
        <div className="mt-4 bg-white rounded-md p-4">
          <h1 className="text-lg font-semibold mb-4">Academic Information</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Branch:</span>
                <span className="text-sm text-gray-600">{student.branch?.shortName || 'Not assigned'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">District:</span>
                <span className="text-sm text-gray-600">{student.branch?.district || 'Not assigned'}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Academic Year ID:</span>
                <span className="text-sm text-gray-600">{student.class?.academicYearId || 'Not assigned'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Language:</span>
                <span className="text-sm text-gray-600">{student.class?.language || 'Not assigned'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* DOCUMENTS */}
        {student.attachments.length > 0 && (
          <div className="mt-4 bg-white rounded-md p-4">
            <h1 className="text-lg font-semibold mb-4">Documents & Images</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {student.attachments.map((attachment, index) => (
                <div key={attachment.id} className="border rounded-md p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Image 
                      src={attachment.fileType.includes('image') ? "/image.png" : "/document.png"} 
                      alt="" 
                      width={16} 
                      height={16} 
                    />
                    <span className="text-sm font-medium capitalize">{attachment.fileType}</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{attachment.originalName}</p>
                  <a
                    href={attachment.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    View/Download
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SCHEDULE */}
        <div className="mt-4 bg-white rounded-md p-4 h-[800px]">
          <h1>Student&apos;s Schedule</h1>
          {student.class ? (
            <BigCalendarContainer type="classId" id={student.class.id} />
          ) : (
            <p className="text-gray-500">No class assigned</p>
          )}
        </div>
      </div>
      
      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-4">
        {/* ACTIONS */}
        {role === "admin" && (
          <div className="bg-white p-4 rounded-md">
            <h1 className="text-lg font-semibold mb-4">Quick Actions</h1>
            <div className="flex flex-col gap-2">
              <FormContainer table="student" type="update" data={student} />
              <FormContainer table="student" type="resetPassword" data={student} />
              <FormContainer table="student" type="sendMessage" data={student} />
              {student.status === "ACTIVE" ? (
                <FormContainer table="student" type="archive" data={student} />
              ) : (
                <FormContainer table="student" type="restore" data={student} />
              )}
              <FormContainer table="student" type="delete" data={student} />
            </div>
          </div>
        )}

        {/* SHORTCUTS */}
        <div className="bg-white p-4 rounded-md">
          <h1 className="text-xl font-semibold">Shortcuts</h1>
          <div className="mt-4 flex gap-4 flex-wrap text-xs text-gray-500">
            {student.class && (
              <>
                <Link
                  className="p-3 rounded-md bg-lamaSkyLight"
                  href={`/admin/list/lessons?classId=${student.class.id}`}
                >
                  Student&apos;s Lessons
                </Link>
                <Link
                  className="p-3 rounded-md bg-lamaPurpleLight"
                  href={`/admin/list/teachers?classId=${student.class.id}`}
                >
                  Student&apos;s Teachers
                </Link>
                <Link
                  className="p-3 rounded-md bg-pink-50"
                  href={`/admin/list/exams?classId=${student.class.id}`}
                >
                  Student&apos;s Exams
                </Link>
                <Link
                  className="p-3 rounded-md bg-lamaSkyLight"
                  href={`/admin/list/assignments?classId=${student.class.id}`}
                >
                  Student&apos;s Assignments
                </Link>
              </>
            )}
            <Link
              className="p-3 rounded-md bg-lamaYellowLight"
              href={`/admin/list/results?studentId=${student.id}`}
            >
              Student&apos;s Results
            </Link>
          </div>
        </div>
        <Performance />
        <Announcements />
      </div>
    </div>
  );
};

export default SingleStudentPage;