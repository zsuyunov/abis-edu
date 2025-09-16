"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { ChevronLeft, ChevronRight } from "lucide-react";

type ValuePiece = Date | null;

type Value = ValuePiece | [ValuePiece, ValuePiece];

const EventCalendar = () => {
  const [value, onChange] = useState<Value>(new Date());

  const router = useRouter();

  useEffect(() => {
    if (value instanceof Date) {
      router.push(`?date=${value}`);
    }
  }, [value, router]);

  const formatMonthYear = (locale: string | undefined, date: Date) => {
    return date.toLocaleDateString(locale || 'en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  const formatShortWeekday = (locale: string | undefined, date: Date) => {
    return date.toLocaleDateString(locale || 'en-US', { weekday: 'short' }).toUpperCase();
  };

  return (
    <div className="modern-calendar w-full">
      <Calendar
         onChange={onChange} 
         value={value}
         formatMonthYear={formatMonthYear}
         formatShortWeekday={formatShortWeekday}
         prevLabel={<ChevronLeft className="h-4 w-4" />}
         nextLabel={<ChevronRight className="h-4 w-4" />}
         className="border-0 bg-transparent"
         tileClassName="hover:bg-sky-50 transition-colors duration-200"
         tileContent={({ date, view }) => {
           const today = new Date();
           const isToday = date.toDateString() === today.toDateString();
           const isSelected = value instanceof Date && date.toDateString() === value.toDateString();
           const isWeekend = date.getDay() === 0 || date.getDay() === 6; // Sunday = 0, Saturday = 6
           
           return (
             <div className="absolute inset-0 flex items-center justify-center">
               <span className={`text-sm font-medium ${
                 isToday ? 'text-white font-bold' : 
                 isSelected ? 'text-white' : 
                 isWeekend ? 'text-red-600' : 'text-gray-700'
               }`}>
                 {date.getDate()}
               </span>
             </div>
           );
         }}
       />
      <style jsx global>{`
         .modern-calendar .react-calendar {
           width: 100%;
           border: none;
           background: transparent;
           max-width: 100%;
         }
         
         .modern-calendar .react-calendar__viewContainer {
           width: 100%;
         }
         
         .modern-calendar .react-calendar__month-view {
           width: 100%;
         }
        
        .modern-calendar .react-calendar__navigation {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding: 0.5rem 0;
        }
        
        .modern-calendar .react-calendar__navigation__label {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1f2937;
          background: none;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          transition: all 0.2s;
        }
        
        .modern-calendar .react-calendar__navigation__label:hover {
          background: #f3f4f6;
        }
        
         .modern-calendar .react-calendar__navigation__arrow {
           background: #0ea5e9;
           color: white;
           border: none;
           border-radius: 0.5rem;
           padding: 0.5rem;
           cursor: pointer;
           transition: all 0.2s;
           display: flex;
           align-items: center;
           justify-content: center;
         }
         
         .modern-calendar .react-calendar__navigation__arrow:hover {
           background: #0284c7;
           transform: scale(1.05);
         }
        
        .modern-calendar .react-calendar__month-view__weekdays {
          margin-bottom: 0.5rem;
        }
        
        .modern-calendar .react-calendar__month-view__weekdays__weekday {
          padding: 0.75rem 0;
          text-align: center;
          font-size: 0.75rem;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .modern-calendar .react-calendar__month-view__days {
          gap: 0.25rem;
        }
        
         .modern-calendar .react-calendar__tile {
           background: none;
           border: none;
           padding: 0;
           height: 2.5rem;
           display: flex;
           align-items: center;
           justify-content: center;
           border-radius: 0.5rem;
           transition: all 0.2s;
           position: relative;
           text-align: center;
         }
        
         .modern-calendar .react-calendar__tile:hover {
           background: #e0f2fe;
         }
         
         .modern-calendar .react-calendar__tile--active {
           background: #0ea5e9 !important;
           color: white !important;
           border-radius: 50%;
         }
         
         .modern-calendar .react-calendar__tile--now {
           background: #0369a1 !important;
           color: white !important;
           font-weight: 600;
           border-radius: 50%;
           box-shadow: 0 0 0 2px #e0f2fe;
         }
         
         .modern-calendar .react-calendar__tile--now:not(.react-calendar__tile--active) {
           background: #0369a1 !important;
           color: white !important;
           font-weight: 600;
           border-radius: 50%;
           box-shadow: 0 0 0 2px #e0f2fe;
         }
        
         .modern-calendar .react-calendar__tile--neighboringMonth {
           color: #d1d5db;
         }
         
         .modern-calendar .react-calendar__tile--neighboringMonth:hover {
           background: #f9fafb;
         }
         
         /* Hide default calendar content to prevent duplicates */
         .modern-calendar .react-calendar__tile abbr {
           display: none;
         }
         
         /* Ensure proper grid alignment */
         .modern-calendar .react-calendar__month-view__days {
           display: grid !important;
           grid-template-columns: repeat(7, 1fr) !important;
           gap: 0.25rem;
           width: 100%;
         }
         
         .modern-calendar .react-calendar__tile {
           position: relative;
           display: flex;
           align-items: center;
           justify-content: center;
           width: 100%;
           height: 2.5rem;
           min-width: 0;
         }
         
         /* Force proper alignment for all tiles */
         .modern-calendar .react-calendar__month-view__weekdays {
           display: grid !important;
           grid-template-columns: repeat(7, 1fr) !important;
           width: 100%;
         }
         
         .modern-calendar .react-calendar__month-view__weekdays__weekday {
           text-align: center;
           padding: 0.75rem 0;
         }
      `}</style>
    </div>
  );
};

export default EventCalendar;
