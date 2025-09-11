/*
"use client";

import { useQuery } from "@tanstack/react-query";

// Main Director API base URL
const MD_API_BASE = "/api/main-director";

// Generic fetch function for Main Director APIs
async function fetchMainDirectorData(endpoint: string, params?: Record<string, string>) {
  const url = new URL(`${MD_API_BASE}${endpoint}`, window.location.origin);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.append(key, value);
    });
  }

  const response = await fetch(url.toString());
  
  if (!response.ok) {
    throw new Error(`Failed to fetch ${endpoint}: ${response.statusText}`);
  }
  
  return response.json();
}

// Hook for fetching teachers
export function useMainDirectorTeachers(page = 1, search = "") {
  return useQuery({
    queryKey: ["main-director-teachers", page, search],
    queryFn: () => fetchMainDirectorData("/teachers", { page: page.toString(), search }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook for fetching students
export function useMainDirectorStudents(page = 1, search = "") {
  return useQuery({
    queryKey: ["main-director-students", page, search],
    queryFn: () => fetchMainDirectorData("/students", { page: page.toString(), search }),
    staleTime: 5 * 60 * 1000,
  });
}

// Hook for fetching parents
export function useMainDirectorParents(page = 1, search = "") {
  return useQuery({
    queryKey: ["main-director-parents", page, search],
    queryFn: () => fetchMainDirectorData("/parents", { page: page.toString(), search }),
    staleTime: 5 * 60 * 1000,
  });
}

// Hook for fetching branches
export function useMainDirectorBranches(page = 1, search = "") {
  return useQuery({
    queryKey: ["main-director-branches", page, search],
    queryFn: () => fetchMainDirectorData("/branches", { page: page.toString(), search }),
    staleTime: 5 * 60 * 1000,
  });
}

// Hook for fetching subjects
export function useMainDirectorSubjects(page = 1, search = "") {
  return useQuery({
    queryKey: ["main-director-subjects", page, search],
    queryFn: () => fetchMainDirectorData("/subjects", { page: page.toString(), search }),
    staleTime: 5 * 60 * 1000,
  });
}

// Hook for fetching classes
export function useMainDirectorClasses(page = 1, search = "") {
  return useQuery({
    queryKey: ["main-director-classes", page, search],
    queryFn: () => fetchMainDirectorData("/classes", { page: page.toString(), search }),
    staleTime: 5 * 60 * 1000,
  });
}

// Hook for fetching academic years
export function useMainDirectorAcademicYears(page = 1, search = "") {
  return useQuery({
    queryKey: ["main-director-academic-years", page, search],
    queryFn: () => fetchMainDirectorData("/academic-years", { page: page.toString(), search }),
    staleTime: 5 * 60 * 1000,
  });
}

// Hook for fetching users
export function useMainDirectorUsers(page = 1, search = "") {
  return useQuery({
    queryKey: ["main-director-users", page, search],
    queryFn: () => fetchMainDirectorData("/users", { page: page.toString(), search }),
    staleTime: 5 * 60 * 1000,
  });
}

// Hook for fetching timetables
export function useMainDirectorTimetables(page = 1, search = "") {
  return useQuery({
    queryKey: ["main-director-timetables", page, search],
    queryFn: () => fetchMainDirectorData("/timetables", { page: page.toString(), search }),
    staleTime: 5 * 60 * 1000,
  });
}


*/