/*
import { useQuery } from "@tanstack/react-query";

// Chief Events Hook
export const useChiefEvents = (page: number = 1, search: string = "") => {
  return useQuery({
    queryKey: ["chief-events", page, search],
    queryFn: async () => {
      const response = await fetch(`/api/chief/events?page=${page}&search=${search}`);
      if (!response.ok) throw new Error("Failed to fetch events");
      return response.json();
    },
  });
};

// Chief Announcements Hook
export const useChiefAnnouncements = (page: number = 1, search: string = "") => {
  return useQuery({
    queryKey: ["chief-announcements", page, search],
    queryFn: async () => {
      const response = await fetch(`/api/chief/announcements?page=${page}&search=${search}`);
      if (!response.ok) throw new Error("Failed to fetch announcements");
      return response.json();
    },
  });
};

// Chief Messages Hook
export const useChiefMessages = (type: string = "inbox", page: number = 1, search: string = "") => {
  return useQuery({
    queryKey: ["chief-messages", type, page, search],
    queryFn: async () => {
      const response = await fetch(`/api/chief/messages?type=${type}&page=${page}&search=${search}`);
      if (!response.ok) throw new Error("Failed to fetch messages");
      return response.json();
    },
  });
};

// Chief Stats Hook
export const useChiefStats = () => {
  return useQuery({
    queryKey: ["chief-stats"],
    queryFn: async () => {
      const response = await fetch("/api/chief/stats");
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
  });
};

// Chief Meal Plans Hook
export const useChiefMealPlans = (page: number = 1, search: string = "") => {
  return useQuery({
    queryKey: ["chief-meal-plans", page, search],
    queryFn: async () => {
      const response = await fetch(`/api/chief/meal-plans?page=${page}&search=${search}`);
      if (!response.ok) throw new Error("Failed to fetch meal plans");
      return response.json();
    },
  });
};

*/