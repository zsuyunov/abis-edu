import Image from "next/image";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { BranchStatus } from "@prisma/client";
import FormContainer from "@/components/FormContainer";
import { headers } from "next/headers";

const SingleBranchPage = async ({
  params,
}: {
  params: { id: string };
}) => {
  const headersList = headers();
  const role = headersList.get("x-user-role") || "";

  const branch = await prisma.branch.findUnique({
    where: {
      id: parseInt(params.id),
    },
    include: {
      director: true,
    },
  });

  if (!branch) {
    notFound();
  }

  const getStatusColor = (status: BranchStatus) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-700";
      case "INACTIVE":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Get statistics for this branch
  const [totalStudents, totalTeachers, totalClasses] = await prisma.$transaction([
    prisma.student.count({
      where: { branchId: branch.id }
    }),
    prisma.teacherAssignment.count({
      where: { 
        branchId: branch.id,
        status: "ACTIVE"
      }
    }),
    prisma.class.count({
      where: { branchId: branch.id }
    })
  ]);

  const stats = {
    totalStudents,
    totalTeachers,
    totalClasses,
    createdDate: branch.createdAt.toLocaleDateString(),
    lastUpdated: branch.updatedAt.toLocaleDateString(),
  };

  return (
    <div className="flex-1 p-4 flex flex-col gap-4 xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3">
        {/* TOP */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* BRANCH CARD */}
          <div className="bg-lamaSky py-6 px-4 rounded-md flex-1 flex gap-4">
            <div className="w-1/3">
              <Image
                src="/singleBranch.png"
                alt=""
                width={144}
                height={144}
                className="w-36 h-36 rounded-full object-cover"
              />
            </div>
            <div className="w-2/3 flex flex-col justify-between">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold">{branch.shortName}</h1>
                {role === "admin" && (
                  <FormContainer table="branch" type="update" data={branch} />
                )}
              </div>
              <p className="text-sm text-gray-500">{branch.legalName}</p>
              <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-medium">
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/phone.png" alt="" width={14} height={14} />
                  <span>{branch.phone}</span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/mail.png" alt="" width={14} height={14} />
                  <span>{branch.email || "No email"}</span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${getStatusColor(
                      branch.status
                    )}`}
                  >
                    {branch.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SMALL CARDS */}
          <div className="flex-1 flex gap-4 justify-between flex-wrap">
            {/* CARD */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image
                src="/singleAttendance.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div className="">
                <h1 className="text-xl font-semibold">{stats.totalStudents}</h1>
                <span className="text-sm text-gray-400">Students</span>
              </div>
            </div>
            {/* CARD */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image
                src="/singleBranch.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div className="">
                <h1 className="text-xl font-semibold">{stats.totalTeachers}</h1>
                <span className="text-sm text-gray-400">Teachers</span>
              </div>
            </div>
            {/* CARD */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image
                src="/singleLesson.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div className="">
                <h1 className="text-xl font-semibold">{stats.totalClasses}</h1>
                <span className="text-sm text-gray-400">Classes</span>
              </div>
            </div>
            {/* CARD */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image
                src="/singleClass.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div className="">
                <h1 className="text-xl font-semibold">{branch.district}</h1>
                <span className="text-sm text-gray-400">District</span>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM */}
        <div className="mt-4 bg-white rounded-md p-4 h-[800px]">
          <h1 className="text-xl font-semibold">Branch Details</h1>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-gray-700 border-b pb-2">Basic Information</h2>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-gray-600">Short Name:</span>
                  <p className="text-sm text-gray-800">{branch.shortName}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Legal Name:</span>
                  <p className="text-sm text-gray-800">{branch.legalName}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">STIR (INN):</span>
                  <p className="text-sm text-gray-800">{branch.stir}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Status:</span>
                  <span
                    className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusColor(
                      branch.status
                    )}`}
                  >
                    {branch.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-gray-700 border-b pb-2">Contact Information</h2>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-gray-600">Phone:</span>
                  <p className="text-sm text-gray-800">{branch.phone}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Email:</span>
                  <p className="text-sm text-gray-800">{branch.email || "Not provided"}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Website:</span>
                  <p className="text-sm text-gray-800">
                    {branch.website ? (
                      <a href={branch.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {branch.website}
                      </a>
                    ) : (
                      "Not provided"
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-gray-700 border-b pb-2">Location Information</h2>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-gray-600">Region:</span>
                  <p className="text-sm text-gray-800">{branch.region}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">District:</span>
                  <p className="text-sm text-gray-800">{branch.district}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Address:</span>
                  <p className="text-sm text-gray-800">{branch.address}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Coordinates:</span>
                  <p className="text-sm text-gray-800">
                    Lat: {branch.latitude}, Lng: {branch.longitude}
                  </p>
                </div>
              </div>
            </div>

            {/* Director Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-gray-700 border-b pb-2">Director Information</h2>
              {branch.director ? (
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Name:</span>
                    <p className="text-sm text-gray-800">
                      {branch.director.firstName} {branch.director.lastName}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Phone:</span>
                    <p className="text-sm text-gray-800">{branch.director.phone}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Email:</span>
                    <p className="text-sm text-gray-800">{branch.director.email || "Not provided"}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Passport Number:</span>
                    <p className="text-sm text-gray-800">{branch.director.passportNumber}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No director assigned</p>
              )}
            </div>

            {/* Statistics */}
            <div className="space-y-4 md:col-span-2">
              <h2 className="text-lg font-medium text-gray-700 border-b pb-2">Statistics & Timestamps</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-600">Created:</span>
                  <p className="text-sm text-gray-800">{stats.createdDate}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Last Updated:</span>
                  <p className="text-sm text-gray-800">{stats.lastUpdated}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Total Students:</span>
                  <p className="text-sm text-gray-800">{stats.totalStudents}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Total Teachers:</span>
                  <p className="text-sm text-gray-800">{stats.totalTeachers}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-4">
        {/* TODO: Add charts or additional statistics here */}
        <div className="bg-white p-4 rounded-md">
          <h1 className="text-xl font-semibold">Quick Actions</h1>
          <div className="mt-4 space-y-2">
            {role === "admin" && (
              <>
                <FormContainer table="branch" type="update" data={branch} />
                <FormContainer table="branch" type="delete" id={branch.id} />
              </>
            )}
          </div>
        </div>

        {/* Map or additional info could go here */}
        <div className="bg-white p-4 rounded-md">
          <h1 className="text-xl font-semibold">Location</h1>
          <div className="mt-4 space-y-2">
            <p className="text-sm text-gray-600">
              This branch is located in {branch.region}, {branch.district} at coordinates:
            </p>
            <p className="text-sm font-mono bg-gray-100 p-2 rounded">
              {branch.latitude}, {branch.longitude}
            </p>
            {/* TODO: You could integrate a map here showing the branch location */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleBranchPage;
