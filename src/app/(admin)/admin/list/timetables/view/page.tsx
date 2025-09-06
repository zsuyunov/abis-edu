"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

interface TimetableData {
  id: number;
  fullDate: string;
  startTime: string;
  endTime: string;
  roomNumber: string;
  buildingName?: string;
  subject: { name: string };
  teacher: { firstName: string; lastName: string };
  status: string;
}

interface FilterData {
  branches: { id: number; shortName: string }[];
  academicYears: { id: number; name: string }[];
  classes: { id: number; name: string; branchId: number; academicYearId: number }[];
}

const TimetableViewPage = () => {
  const [filterData, setFilterData] = useState<FilterData>({
    branches: [],
    academicYears: [],
    classes: [],
  });
  
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [filterType, setFilterType] = useState<"day" | "week" | "month" | "year">("week");
  const [filterDate, setFilterDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const [timetables, setTimetables] = useState<TimetableData[]>([]);
  const [loading, setLoading] = useState(false);

  const [filteredClasses, setFilteredClasses] = useState<any[]>([]);

  // Fetch initial filter data
  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        const [branchesRes, academicYearsRes, classesRes] = await Promise.all([
          fetch("/api/branches"),
          fetch("/api/academic-years/active"),
          fetch("/api/classes"),
        ]);

        const branches = await branchesRes.json();
        const academicYears = await academicYearsRes.json();
        const classes = await classesRes.json();

        setFilterData({ branches, academicYears, classes });
      } catch (error) {
        console.error("Error fetching filter data:", error);
      }
    };

    fetchFilterData();
  }, []);

  // Filter classes based on selected branch and academic year
  useEffect(() => {
    if (selectedBranch && selectedAcademicYear && filterData.classes) {
      const filtered = filterData.classes.filter(
        (cls: any) =>
          cls.branchId === parseInt(selectedBranch) &&
          cls.academicYearId === parseInt(selectedAcademicYear) &&
          cls.status === "ACTIVE"
      );
      setFilteredClasses(filtered);
    } else {
      setFilteredClasses([]);
    }
  }, [selectedBranch, selectedAcademicYear, filterData.classes]);

  // Clear class selection when branch or academic year changes
  useEffect(() => {
    setSelectedClass("");
  }, [selectedBranch, selectedAcademicYear]);

  // Fetch timetables when filters change
  useEffect(() => {
    if (selectedBranch && selectedAcademicYear && selectedClass) {
      fetchTimetables();
    } else {
      setTimetables([]);
    }
  }, [selectedBranch, selectedAcademicYear, selectedClass, filterType, filterDate]);

  const fetchTimetables = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        branchId: selectedBranch,
        academicYearId: selectedAcademicYear,
        classId: selectedClass,
        filterType,
        date: filterDate,
      });

      const response = await fetch(`/api/timetables?${params}`);
      const data = await response.json();
      setTimetables(data);
    } catch (error) {
      console.error("Error fetching timetables:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(new Date(dateString));
  };

  const formatTime = (timeString: string) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(timeString));
  };

  const groupTimetablesByDate = () => {
    const grouped: Record<string, TimetableData[]> = {};
    
    timetables.forEach((timetable) => {
      const dateKey = timetable.fullDate.split('T')[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(timetable);
    });

    // Sort each day's timetables by start time
    Object.keys(grouped).forEach((date) => {
      grouped[date].sort((a, b) => 
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
    });

    return grouped;
  };

  const groupedTimetables = groupTimetablesByDate();

  return (
    <div className="bg-white p-6 rounded-md flex-1 m-4 mt-0">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link 
            href="/admin/list/timetables" 
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <Image src="/close.png" alt="back" width={16} height={16} />
            <span>Back to Timetables</span>
          </Link>
        </div>
        <h1 className="text-xl font-semibold">Timetable View</h1>
      </div>

      {/* FILTERS */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-4">Filter Timetables</h2>
        
        {/* Step 1: Branch Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Step 1: Select Branch
            </label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">Choose a branch</option>
              {filterData.branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.shortName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Step 2: Select Academic Year
            </label>
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
              disabled={!selectedBranch}
            >
              <option value="">Choose academic year</option>
              {filterData.academicYears.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Step 3: Select Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
              disabled={!selectedBranch || !selectedAcademicYear}
            >
              <option value="">Choose a class</option>
              {filteredClasses.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="year">Year</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchTimetables}
              disabled={!selectedBranch || !selectedAcademicYear || !selectedClass}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? "Loading..." : "View Timetable"}
            </button>
          </div>
        </div>
      </div>

      {/* TIMETABLE DISPLAY */}
      {loading && (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading timetables...</p>
        </div>
      )}

      {!loading && Object.keys(groupedTimetables).length === 0 && selectedClass && (
        <div className="text-center py-8">
          <p className="text-gray-500">No timetables found for the selected filters.</p>
        </div>
      )}

      {!loading && Object.keys(groupedTimetables).length > 0 && (
        <div className="space-y-6">
          {Object.entries(groupedTimetables)
            .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
            .map(([date, dayTimetables]) => (
              <div key={date} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-800">
                    {new Intl.DateTimeFormat("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }).format(new Date(date))}
                  </h3>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {dayTimetables.map((timetable) => (
                    <div key={timetable.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4">
                            <div className="text-sm font-medium text-blue-600">
                              {formatTime(timetable.startTime)} - {formatTime(timetable.endTime)}
                            </div>
                            <div className="text-lg font-semibold text-gray-900">
                              {timetable.subject.name}
                            </div>
                            <div className="text-sm text-gray-600">
                              {timetable.teacher.firstName} {timetable.teacher.lastName}
                            </div>
                          </div>
                          <div className="mt-1 text-sm text-gray-500">
                            Room {timetable.roomNumber}
                            {timetable.buildingName && ` - ${timetable.buildingName}`}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            timetable.status === "ACTIVE"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                            {timetable.status}
                          </span>
                          <Link href={`/list/timetables/${timetable.id}`}>
                            <button className="p-1 text-blue-600 hover:text-blue-800">
                              <Image src="/view.png" alt="view" width={16} height={16} />
                            </button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default TimetableViewPage;
