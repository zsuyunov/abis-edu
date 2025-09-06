import prisma from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

const EventDetailPage = async ({ params }: { params: { id: string } }) => {
  const eventId = parseInt(params.id);
  
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      participations: {
        include: {
          // Add user details based on participant type if needed
        }
      },
      _count: {
        select: {
          participations: {
            where: { status: "PARTICIPATING" }
          }
        }
      }
    }
  });

  if (!event) {
    notFound();
  }

  // Calculate participation stats
  const totalInvited = event.participations.length;
  const participating = event.participations.filter(p => p.status === "PARTICIPATING").length;
  const notParticipating = event.participations.filter(p => p.status === "NOT_PARTICIPATING").length;
  const pending = event.participations.filter(p => p.status === "PENDING").length;

  return (
    <div className="flex-1 p-4 flex flex-col gap-4">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/list/events">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaSky hover:bg-lamaSkyLight" title="Back">
              <Image src="/close.png" alt="Back" width={16} height={16} />
            </button>
          </Link>
          <h1 className="text-xl font-semibold">Event Details</h1>
        </div>
      </div>

      {/* EVENT INFO */}
      <div className="bg-white p-6 rounded-md">
        <div className="flex flex-col gap-6">
          {/* Basic Info */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{event.title}</h2>
            <p className="text-gray-600 leading-relaxed">{event.description}</p>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-500">Start Time</span>
              <span className="text-lg text-gray-800">
                {new Date(event.startTime).toLocaleString()}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-500">End Time</span>
              <span className="text-lg text-gray-800">
                {new Date(event.endTime).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Event Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-500">Target Audience</span>
              <span className="text-lg text-gray-800 capitalize">
                {event.targetAudience.replace(/_/g, " ").toLowerCase()}
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-500">Created By</span>
              <span className="text-lg text-gray-800">{event.createdBy}</span>
            </div>
          </div>

          {/* Participation Stats */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Participation Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{totalInvited}</div>
                <div className="text-sm text-blue-600">Total Invited</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{participating}</div>
                <div className="text-sm text-green-600">Participating</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600">{notParticipating}</div>
                <div className="text-sm text-red-600">Not Participating</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-yellow-600">{pending}</div>
                <div className="text-sm text-yellow-600">Pending Response</div>
              </div>
            </div>
          </div>

          {/* Targeting Details */}
          {(event.targetAudience === "SPECIFIC_BRANCHES" || 
            event.targetAudience === "SPECIFIC_CLASSES" || 
            event.targetAudience === "SPECIFIC_USERS") && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Target Audience Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!event.isAllBranches && event.branchIds.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Target Branches</span>
                    <div className="text-gray-800">
                      {event.branchIds.join(", ")} (Branch IDs)
                    </div>
                  </div>
                )}
                {event.classIds.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Target Classes</span>
                    <div className="text-gray-800">
                      {event.classIds.join(", ")} (Class IDs)
                    </div>
                  </div>
                )}
                {event.userIds.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Target Users</span>
                    <div className="text-gray-800">
                      {event.userIds.length} users selected
                    </div>
                  </div>
                )}
                {event.studentIds.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Target Students</span>
                    <div className="text-gray-800">
                      {event.studentIds.length} students selected
                    </div>
                  </div>
                )}
                {event.teacherIds.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Target Teachers</span>
                    <div className="text-gray-800">
                      {event.teacherIds.length} teachers selected
                    </div>
                  </div>
                )}
                {event.parentIds.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Target Parents</span>
                    <div className="text-gray-800">
                      {event.parentIds.length} parents selected
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}


        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;
