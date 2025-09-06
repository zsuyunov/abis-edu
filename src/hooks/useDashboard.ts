"use client";

import { useQuery } from "@tanstack/react-query";

export interface DashboardStats {
  admins: {
    count: number;
    trend: 'up' | 'down' | 'stable';
    percentage: number;
  };
  teachers: {
    count: number;
    trend: 'up' | 'down' | 'stable';
    percentage: number;
  };
  students: {
    count: number;
    trend: 'up' | 'down' | 'stable';
    percentage: number;
  };
  parents: {
    count: number;
    trend: 'up' | 'down' | 'stable';
    percentage: number;
  };
  classes: number;
  subjects: number;
  events: number;
}

const fetchDashboardStats = async (): Promise<DashboardStats> => {
  // Check user role to determine which API endpoint to use
  const userResponse = await fetch('/api/auth/me');
  const userData = await userResponse.json();
  
  const apiEndpoint = userData.user?.role === 'main_director' 
    ? '/api/main-director-dashboard' 
    : '/api/dashboard/stats';
    
  const response = await fetch(apiEndpoint);
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard stats');
  }
  const data = await response.json();
  return data.data;
};

export const useDashboard = () => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 30 * 1000, // Refetch every 30 seconds for real-time feel
  });
};
