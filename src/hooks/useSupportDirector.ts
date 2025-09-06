"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const SD_API_BASE = "/api/support-director";

async function fetchSD(endpoint: string, params?: Record<string, string>) {
  const url = new URL(`${SD_API_BASE}${endpoint}`, window.location.origin);
  if (params) Object.entries(params).forEach(([k, v]) => v && url.searchParams.append(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function mutateSD(endpoint: string, method: string, data?: any) {
  const url = `${SD_API_BASE}${endpoint}`;
  const options: RequestInit = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (data) options.body = JSON.stringify(data);
  
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Helper to create CRUD hooks
function createSDCrudHook(endpoint: string, queryKey: string) {
  return function(params?: { page?: number; search?: string } | number, search?: string) {
    const queryClient = useQueryClient();
    
    // Handle both old (page, search) and new ({page, search}) signatures
    const page = typeof params === 'object' ? (params?.page || 1) : (params || 1);
    const searchTerm = typeof params === 'object' ? (params?.search || '') : (search || '');
    
    const query = useQuery({
      queryKey: [queryKey, page, searchTerm],
      queryFn: () => fetchSD(endpoint, { page: String(page), search: searchTerm }),
      staleTime: 5 * 60 * 1000,
    });

    const createMutation = useMutation({
      mutationFn: (data: any) => mutateSD(endpoint, "POST", data),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryKey] }),
    });

    const updateMutation = useMutation({
      mutationFn: (data: any) => mutateSD(endpoint, "PATCH", data),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryKey] }),
    });

    const archiveMutation = useMutation({
      mutationFn: (data: { id: number }) => mutateSD(`${endpoint}?id=${data.id}`, "DELETE"),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryKey] }),
    });

    const restoreMutation = useMutation({
      mutationFn: (data: { id: number }) => mutateSD(endpoint, "PUT", data),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryKey] }),
    });

    return {
      ...query,
      mutate: createMutation.mutate,
      refetch: query.refetch,
    };
  };
}

export const useSDTeachers = createSDCrudHook("/teachers", "sd-teachers");
export const useSDStudents = createSDCrudHook("/students", "sd-students");
export const useSDParents = createSDCrudHook("/parents", "sd-parents");
export const useSDUsers = createSDCrudHook("/users", "sd-users");
export const useSDSubjects = createSDCrudHook("/subjects", "sd-subjects");
export const useSDClasses = createSDCrudHook("/classes", "sd-classes");
export const useSDTimetables = createSDCrudHook("/timetables", "sd-timetables");
export const useSDAcademicYears = createSDCrudHook("/academic-years", "sd-academic-years");
export const useSDAnnouncements = createSDCrudHook("/announcements", "sd-announcements");
export const useSDEvents = createSDCrudHook("/events", "sd-events");
export const useSDMessages = createSDCrudHook("/messages", "sd-messages");
export const useSDAttendance = createSDCrudHook("/attendance", "sd-attendance");
export const useSDGradebook = createSDCrudHook("/gradebook", "sd-gradebook");
export const useSDHomework = createSDCrudHook("/homework", "sd-homework");
export const useSDExams = createSDCrudHook("/exams", "sd-exams");
export const useSDDocuments = createSDCrudHook("/documents", "sd-documents");
export const useSDComplaints = createSDCrudHook("/complaints", "sd-complaints");