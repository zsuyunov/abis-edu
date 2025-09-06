import prisma, { withPrismaRetry } from "@/lib/prisma";
import { headers } from "next/headers";

const Announcements = async () => {
  const headersList = headers();
  const userId = headersList.get("x-user-id");
  const role = headersList.get("x-user-role");

  // Map roles to audience targeting conditions based on new schema
  const roleConditions = {
    teacher: {
      OR: [
        { targetAudience: "ALL_TEACHERS" },
        { targetAudience: "ALL_USERS" },
        { teacherIds: { has: userId! } },
      ],
    },
    student: {
      OR: [
        { targetAudience: "ALL_STUDENTS" },
        { targetAudience: "ALL_USERS" },
        { studentIds: { has: userId! } },
      ],
    },
    parent: {
      OR: [
        { targetAudience: "ALL_PARENTS" },
        { targetAudience: "ALL_USERS" },
        { parentIds: { has: userId! } },
      ],
    },
    user: {
      OR: [
        { targetAudience: "ALL_USERS" },
        { userIds: { has: userId! } },
      ],
    },
  } as const;

  const condition = role === "admin" ? {} : (roleConditions[(role || "user") as keyof typeof roleConditions] as any);

  const data = await withPrismaRetry(() =>
    prisma.announcement.findMany({
      take: 3,
      orderBy: { date: "desc" },
      where: condition,
    })
  );

  return (
    <div className="bg-white p-4 rounded-md">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Announcements</h1>
        <span className="text-xs text-gray-400">View All</span>
      </div>
      <div className="flex flex-col gap-4 mt-4">
        {data[0] && (
          <div className="bg-lamaSkyLight rounded-md p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-medium">{data[0].title}</h2>
              <span className="text-xs text-gray-400 bg-white rounded-md px-1 py-1">
                {new Intl.DateTimeFormat("en-GB").format(data[0].date)}
              </span>
            </div>
            <p className="text-sm text-gray-400 mt-1">{data[0].description}</p>
          </div>
        )}
        {data[1] && (
          <div className="bg-lamaPurpleLight rounded-md p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-medium">{data[1].title}</h2>
              <span className="text-xs text-gray-400 bg-white rounded-md px-1 py-1">
                {new Intl.DateTimeFormat("en-GB").format(data[1].date)}
              </span>
            </div>
            <p className="text-sm text-gray-400 mt-1">{data[1].description}</p>
          </div>
        )}
        {data[2] && (
          <div className="bg-lamaYellowLight rounded-md p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-medium">{data[2].title}</h2>
              <span className="text-xs text-gray-400 bg-white rounded-md px-1 py-1">
                {new Intl.DateTimeFormat("en-GB").format(data[2].date)}
              </span>
            </div>
            <p className="text-sm text-gray-400 mt-1">{data[2].description}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Announcements;
