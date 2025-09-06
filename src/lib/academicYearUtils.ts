export interface AcademicYearProgress {
  daysPassed: number;
  daysRemaining: number;
  totalDays: number;
  progressPercentage: number;
  isOverdue: boolean;
  shouldBeInactive: boolean;
}

export function calculateAcademicYearProgress(
  startDate: Date,
  endDate: Date,
  currentDate: Date = new Date()
): AcademicYearProgress {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const current = new Date(currentDate);
  
  // Reset time to start of day for accurate calculations
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  current.setHours(0, 0, 0, 0);
  
  const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const daysPassed = Math.ceil((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.ceil((end.getTime() - current.getTime()) / (1000 * 60 * 60 * 24));
  
  const progressPercentage = Math.min(Math.max((daysPassed / totalDays) * 100, 0), 100);
  const isOverdue = current > end;
  const shouldBeInactive = isOverdue;
  
  return {
    daysPassed: Math.max(daysPassed, 0),
    daysRemaining: Math.max(daysRemaining, 0),
    totalDays,
    progressPercentage: Math.round(progressPercentage * 100) / 100,
    isOverdue,
    shouldBeInactive
  };
}

export function formatDays(days: number): string {
  if (days === 0) return "Today";
  if (days === 1) return "1 day";
  if (days < 0) return `${Math.abs(days)} days overdue`;
  return `${days} days`;
}

export function getAcademicYearStatus(startDate: Date, endDate: Date): 'UPCOMING' | 'ACTIVE' | 'COMPLETED' {
  const current = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (current < start) return 'UPCOMING';
  if (current > end) return 'COMPLETED';
  return 'ACTIVE';
}

export function shouldAutoDeactivate(startDate: Date, endDate: Date): boolean {
  const current = new Date();
  const end = new Date(endDate);
  
  // Auto-deactivate if current date is past the end date
  return current > end;
}
