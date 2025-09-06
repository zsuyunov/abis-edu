import prisma from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

const AnnouncementDetailPage = async ({ params }: { params: { id: string } }) => {
  const announcementId = parseInt(params.id);
  
  const announcement = await prisma.announcement.findUnique({
    where: { id: announcementId }
  });

  if (!announcement) {
    notFound();
  }

  return (
    <div className="flex-1 p-4 flex flex-col gap-4">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/list/announcements">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaSky hover:bg-lamaSkyLight" title="Back">
              <Image src="/close.png" alt="Back" width={16} height={16} />
            </button>
          </Link>
          <h1 className="text-xl font-semibold">Announcement Details</h1>
        </div>
      </div>

      {/* ANNOUNCEMENT INFO */}
      <div className="bg-white p-6 rounded-md">
        <div className="flex flex-col gap-6">
          {/* Basic Info */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{announcement.title}</h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{announcement.description}</p>
          </div>

          {/* Announcement Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-500">Date Published</span>
              <span className="text-lg text-gray-800">
                {new Date(announcement.date).toLocaleString()}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-500">Target Audience</span>
              <span className="text-lg text-gray-800 capitalize">
                {announcement.targetAudience.replace(/_/g, " ").toLowerCase()}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-500">Created By</span>
              <span className="text-lg text-gray-800">{announcement.createdBy}</span>
            </div>
          </div>

          {/* Targeting Details */}
          {(announcement.targetAudience === "SPECIFIC_BRANCHES" || 
            announcement.targetAudience === "SPECIFIC_CLASSES" || 
            announcement.targetAudience === "SPECIFIC_USERS") && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Target Audience Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!announcement.isAllBranches && announcement.branchIds.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Target Branches</span>
                    <div className="text-gray-800">
                      {announcement.branchIds.join(", ")} (Branch IDs)
                    </div>
                  </div>
                )}
                {announcement.classIds.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Target Classes</span>
                    <div className="text-gray-800">
                      {announcement.classIds.join(", ")} (Class IDs)
                    </div>
                  </div>
                )}
                {announcement.userIds.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Target Users</span>
                    <div className="text-gray-800">
                      {announcement.userIds.length} users selected
                    </div>
                  </div>
                )}
                {announcement.studentIds.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Target Students</span>
                    <div className="text-gray-800">
                      {announcement.studentIds.length} students selected
                    </div>
                  </div>
                )}
                {announcement.teacherIds.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Target Teachers</span>
                    <div className="text-gray-800">
                      {announcement.teacherIds.length} teachers selected
                    </div>
                  </div>
                )}
                {announcement.parentIds.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Target Parents</span>
                    <div className="text-gray-800">
                      {announcement.parentIds.length} parents selected
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Metadata</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-500">Created At</span>
                <span className="text-gray-800">
                  {new Date(announcement.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-500">Last Updated</span>
                <span className="text-gray-800">
                  {new Date(announcement.updatedAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementDetailPage;
