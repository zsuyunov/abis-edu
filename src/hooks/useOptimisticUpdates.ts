'use client';

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

interface OptimisticUpdateOptions<T> {
  queryKey: string[];
  updateFn: (oldData: T[], newItem: any) => T[];
  revertFn?: (oldData: T[], failedItem: any) => T[];
  successMessage?: string;
  errorMessage?: string;
}

export const useOptimisticUpdates = <T>() => {
  const queryClient = useQueryClient();
  const [pendingUpdates, setPendingUpdates] = useState<Set<string>>(new Set());

  const optimisticUpdate = useCallback(
    async <TData>(
      options: OptimisticUpdateOptions<T>,
      mutationFn: () => Promise<TData>,
      newItem: any,
      itemId: string
    ) => {
      const { queryKey, updateFn, revertFn, successMessage, errorMessage } = options;

      // Add to pending updates
      setPendingUpdates(prev => new Set(prev).add(itemId));

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<{ data: T[] }>(queryKey);

      // Optimistically update the cache
      if (previousData) {
        queryClient.setQueryData<{ data: T[] }>(queryKey, {
          ...previousData,
          data: updateFn(previousData.data, newItem),
        });
      }

      // Show immediate feedback
      toast.info('Processing...', { autoClose: 1000 });

      try {
        // Perform the actual mutation
        const result = await mutationFn();

        // Remove from pending updates
        setPendingUpdates(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });

        // Show success message
        if (successMessage) {
          toast.success(successMessage);
        }

        // Invalidate and refetch to ensure consistency
        queryClient.invalidateQueries({ queryKey });

        return result;
      } catch (error) {
        // Remove from pending updates
        setPendingUpdates(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });

        // Revert the optimistic update
        if (previousData && revertFn) {
          queryClient.setQueryData<{ data: T[] }>(queryKey, {
            ...previousData,
            data: revertFn(previousData.data, newItem),
          });
        } else if (previousData) {
          queryClient.setQueryData(queryKey, previousData);
        }

        // Show error message
        toast.error(errorMessage || 'Operation failed. Please try again.');
        throw error;
      }
    },
    [queryClient]
  );

  const isPending = useCallback((itemId: string) => {
    return pendingUpdates.has(itemId);
  }, [pendingUpdates]);

  return {
    optimisticUpdate,
    isPending,
    pendingCount: pendingUpdates.size,
  };
};

// Specific hooks for common operations
export const useOptimisticAttendance = () => {
  const { optimisticUpdate, isPending } = useOptimisticUpdates();

  const markAttendance = useCallback(
    async (
      studentId: string,
      status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED',
      date: string,
      classId: string
    ) => {
      const attendanceRecord = {
        id: `temp-${Date.now()}`,
        studentId,
        status,
        date,
        classId,
        createdAt: new Date(),
      };

      return optimisticUpdate(
        {
          queryKey: ['attendance', classId, date],
          updateFn: (oldData, newItem) => {
            const existingIndex = oldData.findIndex(
              (item: any) => item.studentId === newItem.studentId && item.date === newItem.date
            );
            if (existingIndex >= 0) {
              // Update existing record
              const updated = [...oldData];
              updated[existingIndex] = { ...(updated[existingIndex] || {}), ...(newItem || {}) };
              return updated;
            } else {
              // Add new record
              return [newItem, ...oldData];
            }
          },
          successMessage: `Attendance marked as ${status.toLowerCase()}`,
          errorMessage: 'Failed to mark attendance',
        },
        () =>
          fetch('/api/attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(attendanceRecord),
          }).then(res => {
            if (!res.ok) throw new Error('Failed to mark attendance');
            return res.json();
          }),
        attendanceRecord,
        `${studentId}-${date}`
      );
    },
    [optimisticUpdate]
  );

  return { markAttendance, isPending };
};

export const useOptimisticHomework = () => {
  const { optimisticUpdate, isPending } = useOptimisticUpdates();

  const submitHomework = useCallback(
    async (homeworkId: string, studentId: string, submission: any) => {
      const submissionRecord = {
        id: `temp-${Date.now()}`,
        homeworkId,
        studentId,
        status: 'SUBMITTED' as const,
        submittedAt: new Date(),
        ...(submission || {}),
      };

      return optimisticUpdate(
        {
          queryKey: ['homework-submissions', homeworkId],
          updateFn: (oldData, newItem) => {
            const existingIndex = oldData.findIndex(
              (item: any) => item.studentId === newItem.studentId
            );
            if (existingIndex >= 0) {
              const updated = [...oldData];
              updated[existingIndex] = { ...(updated[existingIndex] || {}), ...(newItem || {}) };
              return updated;
            } else {
              return [newItem, ...oldData];
            }
          },
          successMessage: 'Homework submitted successfully',
          errorMessage: 'Failed to submit homework',
        },
        () =>
          fetch('/api/homework/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(submissionRecord),
          }).then(res => {
            if (!res.ok) throw new Error('Failed to submit homework');
            return res.json();
          }),
        submissionRecord,
        `${homeworkId}-${studentId}`
      );
    },
    [optimisticUpdate]
  );

  return { submitHomework, isPending };
};

export const useOptimisticGrades = () => {
  const { optimisticUpdate, isPending } = useOptimisticUpdates();

  const updateGrade = useCallback(
    async (studentId: string, subjectId: string, grade: number, examId?: string) => {
      const gradeRecord = {
        id: `temp-${Date.now()}`,
        studentId,
        subjectId,
        examId,
        grade,
        updatedAt: new Date(),
      };

      return optimisticUpdate(
        {
          queryKey: ['grades', studentId, subjectId],
          updateFn: (oldData, newItem) => {
            const existingIndex = oldData.findIndex(
              (item: any) => 
                item.studentId === newItem.studentId && 
                item.subjectId === newItem.subjectId &&
                item.examId === newItem.examId
            );
            if (existingIndex >= 0) {
              const updated = [...oldData];
              updated[existingIndex] = { ...(updated[existingIndex] || {}), ...(newItem || {}) };
              return updated;
            } else {
              return [newItem, ...oldData];
            }
          },
          successMessage: 'Grade updated successfully',
          errorMessage: 'Failed to update grade',
        },
        () =>
          fetch('/api/grades', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(gradeRecord),
          }).then(res => {
            if (!res.ok) throw new Error('Failed to update grade');
            return res.json();
          }),
        gradeRecord,
        `${studentId}-${subjectId}-${examId || 'general'}`
      );
    },
    [optimisticUpdate]
  );

  return { updateGrade, isPending };
};
