import FormContainer from "@/components/FormContainer";
import SmallParentResetPasswordModal from "@/components/SmallParentResetPasswordModal";
import SmallParentSendMessageModal from "@/components/SmallParentSendMessageModal";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { Parent } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

type ParentWithDetails = any;

const SingleParentPage = async ({
  params: { id },
}: {
  params: { id: string };
}) => {
  const headersList = headers();
  const role = headersList.get("x-user-role");

  const parent: ParentWithDetails | null = await prisma.parent.findUnique({
    where: { id },
    include: {
      studentParents: {
        include: {
          student: {
            include: {
              class: { include: { branch: true } },
              branch: true,
            },
          },
        },
      },
    },
  });

  if (!parent) {
    return notFound();
  }

  return (
    <div className="flex-1 p-4 flex flex-col gap-4 xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3">
        {/* PARENT INFO CARD */}
        <div className="bg-lamaSky py-6 px-4 rounded-md flex gap-4 mb-4">
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
                {parent.firstName} {parent.lastName}
              </h1>
              <span
                className={`px-2 py-1 rounded-full text-xs ${
                  parent.status === "ACTIVE"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {parent.status}
              </span>
              {role === "admin" && (
                <FormContainer table="parent" type="update" data={parent} />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Parent ID:</span>
                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                  {parent.parentId}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Total Children:</span>
                <span className="text-sm text-gray-600">{parent.studentParents.length}</span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-medium">
              <div className="w-full md:w-1/2 flex items-center gap-2">
                <Image src="/phone.png" alt="" width={14} height={14} />
                <span>{parent.phone}</span>
              </div>
              <div className="w-full md:w-1/2 flex items-center gap-2">
                <Image src="/date.png" alt="" width={14} height={14} />
                <span>
                  Joined: {new Intl.DateTimeFormat("en-GB").format(parent.createdAt)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CHILDREN INFORMATION */}
        <div className="bg-white rounded-md p-4">
          <h1 className="text-lg font-semibold mb-4">Children ({parent.studentParents.length})</h1>
          {parent.studentParents.length > 0 ? (
            <div className="grid gap-4">
              {parent.studentParents.map((studentParent: any) => {
                const student = studentParent.student;
                return (
                <div key={student.id} className="border rounded-md p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="font-semibold">
                          {student.firstName} {student.lastName}
                        </h3>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {student.studentId}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            student.status === "ACTIVE"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {student.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Class:</span> {student.class?.name || 'Not assigned'}
                        </div>
                        {/* Grade removed */}
                        <div>
                          <span className="font-medium">Branch:</span> {student.branch?.shortName || 'Not assigned'}
                        </div>
                        <div>
                          <span className="font-medium">Phone:</span> {student.phone}
                        </div>
                        <div>
                          <span className="font-medium">Gender:</span> {student.gender}
                        </div>
                        <div>
                          <span className="font-medium">Birth Date:</span>{" "}
                          {new Intl.DateTimeFormat("en-GB").format(student.dateOfBirth)}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Link
                        href={`/admin/list/students/${student.id}`}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md text-xs hover:bg-blue-200"
                      >
                        View Profile
                      </Link>
                      {role === "admin" && (
                        <Link
                          href={`/admin/list/results?studentId=${student.id}`}
                          className="px-3 py-1 bg-green-100 text-green-800 rounded-md text-xs hover:bg-green-200"
                        >
                          View Results
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Image
                src="/noData.png"
                alt="No children"
                width={64}
                height={64}
                className="mx-auto mb-4 opacity-50"
              />
              <p>No children assigned to this parent</p>
            </div>
          )}
        </div>

        {/* CONTACT HISTORY */}
        <div className="mt-4 bg-white rounded-md p-4">
          <h1 className="text-lg font-semibold mb-4">Recent Activity</h1>
          <div className="text-center py-8 text-gray-500">
            <p>Activity tracking coming soon...</p>
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-4">
        {/* ACTIONS */}
        {role === "admin" && (
          <div className="bg-white p-4 rounded-md">
            <h1 className="text-lg font-semibold mb-4">Quick Actions</h1>
            <div className="flex flex-col gap-2">
              <FormContainer table="parent" type="update" data={parent} />
              <SmallParentResetPasswordModal 
                parentId={parent.id} 
                parentName={`${parent.firstName} ${parent.lastName}`}
                currentUserId="admin"
              />
              <SmallParentSendMessageModal 
                parentId={parent.id} 
                parentName={`${parent.firstName} ${parent.lastName}`}
                currentUserId="admin"
              />
              <FormContainer table="parent" type="unassign" data={parent} />
            </div>
          </div>
        )}

        {/* STATISTICS */}
        <div className="bg-white p-4 rounded-md">
          <h1 className="text-lg font-semibold mb-4">Statistics</h1>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Children:</span>
              <span className="font-semibold">{parent.studentParents.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Active Students:</span>
              <span className="font-semibold">
                {parent.studentParents.filter((sp: any) => sp.student.status === "ACTIVE").length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Different Branches:</span>
              <span className="font-semibold">
                {new Set(parent.studentParents.map((sp: any) => sp.student.branchId)).size}
              </span>
            </div>
            {/* Grade metric removed per request */}
          </div>
        </div>

        {/* SHORTCUTS */}
        <div className="bg-white p-4 rounded-md">
          <h1 className="text-lg font-semibold mb-4">Quick Links</h1>
          <div className="flex flex-col gap-2">
            {parent.studentParents.map((studentParent: any) => {
              const student = studentParent.student;
              return (
                <Link
                  key={student.id}
                  href={`/admin/list/students/${student.id}`}
                  className="p-2 bg-gray-50 rounded-md text-sm hover:bg-gray-100"
                >
                  {student.firstName} {student.lastName} - {student.class?.name || 'Not assigned'}
                </Link>
              );
            })}
            <Link
              href={`/admin/list/students?parentId=${parent.id}`}
              className="p-2 bg-blue-50 text-blue-800 rounded-md text-sm hover:bg-blue-100 mt-2"
            >
              View All Children
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleParentPage;
