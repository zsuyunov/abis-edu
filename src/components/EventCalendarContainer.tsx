import Image from "next/image";
import EventCalendar from "./EventCalendar";
import EventList from "./EventList";
import { Calendar, MoreHorizontal } from "lucide-react";

const EventCalendarContainer = async ({
  searchParams,
}: {
  searchParams?: { [keys: string]: string | undefined };
}) => {
  const { date } = searchParams || {};
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-500 to-sky-600 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Calendar className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Calendar</h2>
            <p className="text-sky-100 text-sm">September 2025</p>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="p-6">
        <EventCalendar />
      </div>

      {/* Events Section */}
      <div className="border-t border-gray-100">
        <div className="px-6 py-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <div className="w-2 h-2 bg-sky-500 rounded-full"></div>
              Events
            </h3>
            <button className="p-1 hover:bg-gray-200 rounded-lg transition-colors">
              <MoreHorizontal className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>
        <div className="px-6 pb-6">
          <EventList dateParam={date} />
        </div>
      </div>
    </div>
  );
};

export default EventCalendarContainer;
