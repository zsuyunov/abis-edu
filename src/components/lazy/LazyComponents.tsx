"use client";

import { lazy, Suspense } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import SkeletonLoader from "@/components/ui/SkeletonLoader";

// Lazy load heavy components for code splitting
export const LazyStudentAttendanceContainer = lazy(() => import("@/components/StudentAttendanceContainer"));
export const LazyStudentAttendanceAnalytics = lazy(() => import("@/components/StudentAttendanceAnalytics"));
export const LazyStudentGradeStatistics = lazy(() => import("@/components/StudentGradeStatistics"));
export const LazyTeacherHomeworkContainer = lazy(() => import("@/components/TeacherHomeworkContainer"));
export const LazyTeacherHomeworkCreationForm = lazy(() => import("@/components/TeacherHomeworkCreationForm"));
export const LazyAttendanceForm = lazy(() => import("@/components/forms/AttendanceForm"));
export const LazyGradeInputForm = lazy(() => import("@/components/GradeInputForm"));

// Wrapper components with optimized loading states
export const StudentAttendanceContainerLazy = (props: any) => (
  <Suspense fallback={<SkeletonLoader variant="dashboard" />}>
    <LazyStudentAttendanceContainer {...props} />
  </Suspense>
);

export const StudentAttendanceAnalyticsLazy = (props: any) => (
  <Suspense fallback={<SkeletonLoader variant="card" count={3} />}>
    <LazyStudentAttendanceAnalytics {...props} />
  </Suspense>
);

export const StudentGradeStatisticsLazy = (props: any) => (
  <Suspense fallback={<SkeletonLoader variant="card" count={2} />}>
    <LazyStudentGradeStatistics {...props} />
  </Suspense>
);

export const TeacherHomeworkContainerLazy = (props: any) => (
  <Suspense fallback={<LoadingSpinner variant="educational" text="Loading Homework Management" />}>
    <LazyTeacherHomeworkContainer {...props} />
  </Suspense>
);

export const TeacherHomeworkCreationFormLazy = (props: any) => (
  <Suspense fallback={<LoadingSpinner variant="pulse" text="Loading Form" />}>
    <LazyTeacherHomeworkCreationForm {...props} />
  </Suspense>
);

export const AttendanceFormLazy = (props: any) => (
  <Suspense fallback={<LoadingSpinner variant="dots" text="Loading Attendance" />}>
    <LazyAttendanceForm {...props} />
  </Suspense>
);

export const GradeInputFormLazy = (props: any) => (
  <Suspense fallback={<LoadingSpinner variant="bounce" text="Loading Gradebook" />}>
    <LazyGradeInputForm {...props} />
  </Suspense>
);
