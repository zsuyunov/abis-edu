import Announcements from "@/components/Announcements";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import ParentNotifications from "@/components/ParentNotifications";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";


const ParentPage = async () => {
  const headersList = headers();
  const currentUserId = headersList.get("x-user-id");
  
  const students = await prisma.student.findMany({
    where: {
      studentParents: {
        some: {
          parentId: currentUserId!,
        },
      },
    },
  });

  return (
    <div className="flex-1 p-4 flex gap-4 flex-col xl:flex-row">
      {/* LEFT */}
      <div className="">
        {(students as any[]).map((student) => (
          <div className="w-full xl:w-2/3" key={student.id}>
            <div className="h-full bg-white p-4 rounded-md">
              <h1 className="text-xl font-semibold">
                {(() => {
                  const s = student as any;
                  const first = s.firstName ?? s.name ?? "";
                  const last = s.lastName ?? s.surname ?? "";
                  return `Schedule (${first} ${last})`;
                })()}
              </h1>
              <BigCalendarContainer type="classId" id={student.classId} />
            </div>
          </div>
        ))}
      </div>
      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-8">
        <ParentNotifications parentId={currentUserId!} />
        <Announcements />
      </div>
    </div>
  );
};

export default ParentPage;
