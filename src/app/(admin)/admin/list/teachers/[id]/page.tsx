import Announcements from "@/components/Announcements";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import FormContainer from "@/components/FormContainer";
import Performance from "@/components/Performance";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { Branch, Class, Teacher, TeacherAttachment, TeacherAssignment, Subject } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

type TeacherWithDetails = Teacher & {
  TeacherAssignment: (TeacherAssignment & {
    Subject: Subject | null;
    Class: Class | null;
    Branch: Branch | null;
  })[];
  attachments: TeacherAttachment[];
};

const SingleTeacherPage = async ({
  params: { id },
}: {
  params: { id: string };
}) => {
  const headersList = headers();
  const role = headersList.get("x-user-role");

  const teacher: TeacherWithDetails | null = await prisma.teacher.findUnique({
    where: { id },
    include: {
      TeacherAssignment: {
        include: {
          Subject: true,
          Class: true,
          Branch: true,
        },
      },
      attachments: true,
    },
  });

  if (!teacher) {
    return notFound();
  }

  // Calculate statistics
  const totalSubjects = teacher.TeacherAssignment.filter(ta => ta.Subject).length;
  const totalClasses = teacher.TeacherAssignment.filter(ta => ta.Class).length;
  const supervisorClasses = teacher.TeacherAssignment.filter(ta => ta.role === "SUPERVISOR").length;

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
                  {teacher.firstName} {teacher.lastName}
                </h1>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    teacher.status === "ACTIVE"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {teacher.status}
                </span>
                {role === "admin" && (
                  <FormContainer table="teacher" type="update" data={teacher} />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Teacher ID:</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                    {teacher.teacherId}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Gender:</span>
                  <span className="text-sm text-gray-600">{teacher.gender}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Email:</span>
                  <span className="text-sm text-gray-600">{teacher.email || 'Not provided'}</span>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-medium">
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/date.png" alt="" width={14} height={14} />
                  <span>
                    {teacher.dateOfBirth ? new Intl.DateTimeFormat("en-GB").format(teacher.dateOfBirth) : 'Not provided'}
                  </span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/phone.png" alt="" width={14} height={14} />
                  <span>{teacher.phone}</span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/email.png" alt="" width={14} height={14} />
                  <span>{teacher.email}</span>
                </div>
              </div>
            </div>
          </div>
          {/* SMALL CARDS */}
          <div className="flex-1 flex gap-4 justify-between flex-wrap">
            {/* SUBJECTS CARD */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image
                src="/singleSubject.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div className="">
                <h1 className="text-xl font-semibold">{totalSubjects}</h1>
                <span className="text-sm text-gray-400">Subjects</span>
              </div>
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
                  {teacher.TeacherAssignment.length > 0 ? teacher.TeacherAssignment[0].Branch?.shortName || 'Not assigned' : 'Not assigned'}
                </h1>
                <span className="text-sm text-gray-400">Branch</span>
              </div>
            </div>
            {/* CLASSES CARD */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image
                src="/singleClass.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div className="">
                <h1 className="text-xl font-semibold">{totalClasses}</h1>
                <span className="text-sm text-gray-400">Classes</span>
              </div>
            </div>
            {/* SUPERVISOR CARD */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image
                src="/singleSupervisor.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div className="">
                <h1 className="text-xl font-semibold">{supervisorClasses}</h1>
                <span className="text-sm text-gray-400">Supervisor</span>
              </div>
            </div>
          </div>
        </div>

        {/* TEACHER ASSIGNMENTS */}
        <div className="mt-4 bg-white rounded-md p-4">
          <h1 className="text-lg font-semibold mb-4">Teaching Assignments</h1>
          {teacher.TeacherAssignment.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teacher.TeacherAssignment.map((assignment, index) => (
                <div key={assignment.id} className="border rounded-md p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      {assignment.Subject?.name || 'No Subject'}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      assignment.role === 'SUPERVISOR' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {assignment.role}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {assignment.Class?.name || 'No Class Assigned'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No teaching assignments found</p>
          )}
        </div>

        {/* ACADEMIC INFORMATION */}
        <div className="mt-4 bg-white rounded-md p-4">
          <h1 className="text-lg font-semibold mb-4">Academic Information</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Branch:</span>
                <span className="text-sm text-gray-600">
                  {teacher.TeacherAssignment.length > 0 ? teacher.TeacherAssignment[0].Branch?.shortName || 'Not assigned' : 'Not assigned'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">District:</span>
                <span className="text-sm text-gray-600">
                  {teacher.TeacherAssignment.length > 0 ? teacher.TeacherAssignment[0].Branch?.district || 'Not assigned' : 'Not assigned'}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Email:</span>
                <span className="text-sm text-gray-600">{teacher.email || 'Not provided'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Address:</span>
                <span className="text-sm text-gray-600">{teacher.address || 'Not provided'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* DOCUMENTS */}
        {teacher.attachments.length > 0 && (
          <div className="mt-4 bg-white rounded-md p-4">
            <h1 className="text-lg font-semibold mb-4">Documents & Images</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {teacher.attachments.map((attachment, index) => (
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
          <h1>Teacher&apos;s Schedule</h1>
          <BigCalendarContainer type="teacherId" id={teacher.id} />
        </div>
      </div>
      
      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-4">
        {/* ACTIONS */}
        {role === "admin" && (
          <div className="bg-white p-4 rounded-md">
            <h1 className="text-lg font-semibold mb-4">Quick Actions</h1>
            <div className="flex flex-col gap-2">
              <FormContainer table="teacher" type="update" data={teacher} />
              <FormContainer table="teacher" type="resetPassword" data={teacher} />
              <FormContainer table="teacher" type="sendMessage" data={teacher} />
              {teacher.status === "ACTIVE" ? (
                <FormContainer table="teacher" type="archive" data={teacher} />
              ) : (
                <FormContainer table="teacher" type="restore" data={teacher} />
              )}
              <FormContainer table="teacher" type="delete" data={teacher} />
            </div>
          </div>
        )}

        {/* SHORTCUTS */}
        <div className="bg-white p-4 rounded-md">
          <h1 className="text-xl font-semibold">Shortcuts</h1>
          <div className="mt-4 flex gap-4 flex-wrap text-xs text-gray-500">
            <Link
              className="p-3 rounded-md bg-lamaSkyLight"
              href={`/admin/list/lessons?teacherId=${teacher.id}`}
            >
              Teacher&apos;s Lessons
            </Link>
            <Link
              className="p-3 rounded-md bg-lamaPurpleLight"
              href={`/admin/list/classes?teacherId=${teacher.id}`}
            >
              Teacher&apos;s Classes
            </Link>
            <Link
              className="p-3 rounded-md bg-pink-50"
              href={`/admin/list/subjects?teacherId=${teacher.id}`}
            >
              Teacher&apos;s Subjects
            </Link>
            <Link
              className="p-3 rounded-md bg-lamaSkyLight"
              href={`/admin/list/assignments?teacherId=${teacher.id}`}
            >
              Teacher&apos;s Assignments
            </Link>
            <Link
              className="p-3 rounded-md bg-lamaYellowLight"
              href={`/admin/list/results?teacherId=${teacher.id}`}
            >
              Teacher&apos;s Results
            </Link>
          </div>
        </div>
        <Performance />
        <Announcements />
      </div>
    </div>
  );
};

export default SingleTeacherPage;
