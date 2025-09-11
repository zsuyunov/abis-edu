/*import { useQuery } from "@tanstack/react-query";

// Doctor Events Hook
export const useDoctorEvents = (page: number = 1, search: string = "") => {
  return useQuery({
    queryKey: ["doctor-events", page, search],
    queryFn: async () => {
      const response = await fetch(`/api/doctor/events?page=${page}&search=${search}`);
      if (!response.ok) throw new Error("Failed to fetch events");
      return response.json();
    },
  });
};

// Doctor Announcements Hook
export const useDoctorAnnouncements = (page: number = 1, search: string = "") => {
  return useQuery({
    queryKey: ["doctor-announcements", page, search],
    queryFn: async () => {
      const response = await fetch(`/api/doctor/announcements?page=${page}&search=${search}`);
      if (!response.ok) throw new Error("Failed to fetch announcements");
      return response.json();
    },
  });
};

// Doctor Messages Hook
export const useDoctorMessages = (type: string = "inbox", page: number = 1, search: string = "") => {
  return useQuery({
    queryKey: ["doctor-messages", type, page, search],
    queryFn: async () => {
      const response = await fetch(`/api/doctor/messages?type=${type}&page=${page}&search=${search}`);
      if (!response.ok) throw new Error("Failed to fetch messages");
      return response.json();
    },
  });
};

// Doctor Stats Hook
export const useDoctorStats = () => {
  return useQuery({
    queryKey: ["doctor-stats"],
    queryFn: async () => {
      const response = await fetch("/api/doctor/stats");
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
  });
};

// Doctor Meal Approvals Hook
export const useDoctorMealApprovals = (page: number = 1, search: string = "") => {
  return useQuery({
    queryKey: ["doctor-meal-approvals", page, search],
    queryFn: async () => {
      const response = await fetch(`/api/doctor/meal-approvals?page=${page}&search=${search}`);
      if (!response.ok) throw new Error("Failed to fetch meal approvals");
      return response.json();
    },
  });
};


*/