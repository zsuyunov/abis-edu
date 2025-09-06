"use client";

import { useEffect, useState } from "react";

type AnnouncementItem = {
  id: number;
  title: string;
  description: string;
  date: string;
};

const AnnouncementsClient = () => {
  const [items, setItems] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/announcements", { cache: "no-store" });
        const data = await res.json();
        const list: AnnouncementItem[] = Array.isArray(data)
          ? data.slice(0, 3)
          : [];
        setItems(list);
      } catch (e) {
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="bg-white p-4 rounded-md">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Announcements</h1>
          <span className="text-xs text-gray-400">View All</span>
        </div>
        <div className="flex flex-col gap-4 mt-4">
          {[1, 2, 3].map((k) => (
            <div key={k} className="rounded-md p-4 bg-gray-100 animate-pulse">
              <div className="h-5 bg-gray-300 rounded w-1/2 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-5/6" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-md">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Announcements</h1>
        <span className="text-xs text-gray-400">View All</span>
      </div>
      <div className="flex flex-col gap-4 mt-4">
        {items[0] && (
          <div className="bg-lamaSkyLight rounded-md p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-medium">{items[0].title}</h2>
              <span className="text-xs text-gray-400 bg-white rounded-md px-1 py-1">
                {new Intl.DateTimeFormat("en-GB").format(new Date(items[0].date))}
              </span>
            </div>
            <p className="text-sm text-gray-400 mt-1">{items[0].description}</p>
          </div>
        )}
        {items[1] && (
          <div className="bg-lamaPurpleLight rounded-md p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-medium">{items[1].title}</h2>
              <span className="text-xs text-gray-400 bg-white rounded-md px-1 py-1">
                {new Intl.DateTimeFormat("en-GB").format(new Date(items[1].date))}
              </span>
            </div>
            <p className="text-sm text-gray-400 mt-1">{items[1].description}</p>
          </div>
        )}
        {items[2] && (
          <div className="bg-lamaYellowLight rounded-md p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-medium">{items[2].title}</h2>
              <span className="text-xs text-gray-400 bg-white rounded-md px-1 py-1">
                {new Intl.DateTimeFormat("en-GB").format(new Date(items[2].date))}
              </span>
            </div>
            <p className="text-sm text-gray-400 mt-1">{items[2].description}</p>
          </div>
        )}
        {!items.length && (
          <div className="text-xs text-gray-500">No announcements</div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementsClient;


