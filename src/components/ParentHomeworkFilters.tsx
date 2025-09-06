'use client';

import React from 'react';
import { AcademicYear, Subject } from '@prisma/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface ParentHomeworkFiltersProps {
  academicYears: AcademicYear[];
  subjects: Subject[];
  selectedAcademicYearId: number | null;
  setSelectedAcademicYearId: (id: number | null) => void;
  selectedSubjectId: number | null;
  setSelectedSubjectId: (id: number | null) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  startDate: Date | null;
  setStartDate: (date: Date | null) => void;
  endDate: Date | null;
  setEndDate: (date: Date | null) => void;
  showPastAcademicYears: boolean;
  onAcademicYearToggle: (showPast: boolean) => void;
  onApplyFilters: () => void;
}

const ParentHomeworkFilters: React.FC<ParentHomeworkFiltersProps> = ({
  academicYears,
  subjects,
  selectedAcademicYearId,
  setSelectedAcademicYearId,
  selectedSubjectId,
  setSelectedSubjectId,
  statusFilter,
  setStatusFilter,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  showPastAcademicYears,
  onAcademicYearToggle,
  onApplyFilters,
}) => {
  const filteredAcademicYears = showPastAcademicYears ? academicYears : academicYears.filter(year => year.isCurrent);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Filter Child's Homework</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="past-academic-year-toggle"
            checked={showPastAcademicYears}
            onCheckedChange={onAcademicYearToggle}
          />
          <Label htmlFor="past-academic-year-toggle">View Past Academic Years</Label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="academic-year-select">Academic Year</Label>
            <Select
              value={selectedAcademicYearId?.toString() || ''}
              onValueChange={(value) => setSelectedAcademicYearId(parseInt(value))}
            >
              <SelectTrigger id="academic-year-select">
                <SelectValue placeholder="Select Academic Year" />
              </SelectTrigger>
              <SelectContent>
                {filteredAcademicYears.map(year => (
                  <SelectItem key={year.id} value={year.id.toString()}>
                    {year.name} {year.isCurrent ? '(Current)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="subject-select">Subject</Label>
            <Select
              value={selectedSubjectId?.toString() || ''}
              onValueChange={(value) => setSelectedSubjectId(value ? parseInt(value) : null)}
            >
              <SelectTrigger id="subject-select">
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Subjects</SelectItem>
                {subjects.map(subject => (
                  <SelectItem key={subject.id} value={subject.id.toString()}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="status-select">Submission Status</Label>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger id="status-select">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="start-date-picker">Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={`w-full justify-start text-left font-normal ${!startDate && 'text-muted-foreground'}`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'PP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate || undefined}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex-1">
              <Label htmlFor="end-date-picker">End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={`w-full justify-start text-left font-normal ${!endDate && 'text-muted-foreground'}`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'PP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate || undefined}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button onClick={onApplyFilters}>Apply Filters</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ParentHomeworkFilters;
