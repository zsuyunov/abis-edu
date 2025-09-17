import BigCalendar from "./BigCalender";
import { adjustScheduleToCurrentWeek } from "@/lib/utils";
import prisma from "@/lib/prisma";

const BigCalendarContainer = async ({
  type,
  id,
}: {
  type: "teacherId" | "classId";
  id: string | number;
}) => {
  const dataRes = await prisma.timetable.findMany({
    where: type === "teacherId"
      ? { teacherIds: { hasSome: [String(id)] } }
      : { classId: typeof id === "number" ? id : parseInt(String(id), 10) },
    include: {
      subject: { select: { name: true } },
    },
    take: 500,
    orderBy: { startTime: "asc" },
  });

  const data = dataRes.map((timetable) => ({
    title: `${timetable.subject?.name || 'Class'} - Room ${timetable.roomNumber}`,
    start: timetable.startTime,
    end: timetable.endTime,
  }));

  const schedule = adjustScheduleToCurrentWeek(data);

  return (
    <div className="">
      <BigCalendar data={schedule} />
    </div>
  );
};

export default BigCalendarContainer;
