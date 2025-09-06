import * as React from "react"
import { cn } from "@/lib/utils"

export interface CalendarProps {
  mode?: "single" | "multiple" | "range"
  selected?: Date
  onSelect?: (date: Date | null) => void
  initialFocus?: boolean
  className?: string
}

const Calendar = React.forwardRef<HTMLDivElement, CalendarProps>(
  ({ className, mode = "single", selected, onSelect, initialFocus, ...props }, ref) => {
    const [currentDate, setCurrentDate] = React.useState(new Date())
    
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()
    
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
    const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
    
    const handleDateClick = (day: number) => {
      const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      onSelect?.(newDate)
    }
    
    const isSelected = (day: number) => {
      if (!selected) return false
      const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      return dayDate.toDateString() === selected.toDateString()
    }

    return (
      <div
        ref={ref}
        className={cn("p-3", className)}
        {...props}
      >
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
            className="p-1 hover:bg-gray-100 rounded"
          >
            ←
          </button>
          <h3 className="font-semibold">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
            className="p-1 hover:bg-gray-100 rounded"
          >
            →
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 p-2">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayOfMonth }, (_, i) => (
            <div key={`empty-${i}`} className="p-2" />
          ))}
          {days.map(day => (
            <button
              key={day}
              onClick={() => handleDateClick(day)}
              className={cn(
                "p-2 text-sm rounded hover:bg-gray-100",
                isSelected(day) && "bg-blue-500 text-white hover:bg-blue-600"
              )}
            >
              {day}
            </button>
          ))}
        </div>
      </div>
    )
  }
)
Calendar.displayName = "Calendar"

export { Calendar }
