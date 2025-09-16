"use client";

import { useState, useEffect } from "react";

interface TimeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const TimeSelector = ({ value, onChange, placeholder = "Select Time", disabled = false }: TimeSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState(10);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('AM');

  // Parse initial value
  useEffect(() => {
    if (value) {
      const timeMatch = value.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (timeMatch) {
        let hour = parseInt(timeMatch[1]);
        const minute = parseInt(timeMatch[2]);
        const period = timeMatch[3].toUpperCase() as 'AM' | 'PM';
        
        // Convert to 24-hour format for internal handling
        if (period === 'PM' && hour !== 12) hour += 12;
        if (period === 'AM' && hour === 12) hour = 0;
        
        setSelectedHour(hour);
        setSelectedMinute(minute);
        setSelectedPeriod(period);
      }
    }
  }, [value]);

  // Generate time options
  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);
  const periods: ('AM' | 'PM')[] = ['AM', 'PM'];

  const handleTimeChange = (hour: number, minute: number, period: 'AM' | 'PM') => {
    setSelectedHour(hour);
    setSelectedMinute(minute);
    setSelectedPeriod(period);
    
    // Convert to 12-hour format for display
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const timeString = `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
    onChange(timeString);
    setIsOpen(false);
  };

  const formatDisplayValue = () => {
    if (!value) return placeholder;
    return value;
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full p-2 border border-gray-300 rounded-md text-left bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        <div className="flex items-center justify-between">
          <span className={value ? "text-gray-900" : "text-gray-500"}>
            {formatDisplayValue()}
          </span>
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="p-4">
            <div className="flex space-x-4">
              {/* Hours Column */}
              <div className="flex-1">
                <div className="text-xs font-medium text-gray-500 mb-2 text-center">Hour</div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {hours.map((hour) => (
                    <button
                      key={hour}
                      type="button"
                      onClick={() => handleTimeChange(hour, selectedMinute, selectedPeriod)}
                      className={`w-full py-2 px-3 text-sm rounded-md transition-colors ${
                        (selectedHour === hour || (selectedHour === 0 && hour === 12) || (selectedHour > 12 && selectedHour - 12 === hour)) && selectedPeriod === selectedPeriod
                          ? 'bg-blue-500 text-white'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      {hour.toString().padStart(2, '0')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Minutes Column */}
              <div className="flex-1">
                <div className="text-xs font-medium text-gray-500 mb-2 text-center">Minute</div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {minutes.filter((_, i) => i % 5 === 0).map((minute) => (
                    <button
                      key={minute}
                      type="button"
                      onClick={() => handleTimeChange(selectedHour, minute, selectedPeriod)}
                      className={`w-full py-2 px-3 text-sm rounded-md transition-colors ${
                        selectedMinute === minute
                          ? 'bg-blue-500 text-white'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      {minute.toString().padStart(2, '0')}
                    </button>
                  ))}
                </div>
              </div>

              {/* AM/PM Column */}
              <div className="flex-1">
                <div className="text-xs font-medium text-gray-500 mb-2 text-center">Period</div>
                <div className="space-y-1">
                  {periods.map((period) => (
                    <button
                      key={period}
                      type="button"
                      onClick={() => handleTimeChange(selectedHour, selectedMinute, period)}
                      className={`w-full py-2 px-3 text-sm rounded-md transition-colors ${
                        selectedPeriod === period
                          ? 'bg-blue-500 text-white'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeSelector;
