"use client";

import Image from "next/image";

interface UserCardClientProps {
  type: "admin" | "teacher" | "student" | "parent" | "staff";
  count: number;
  subtitle?: string;
}

const UserCardClient = ({ type, count, subtitle }: UserCardClientProps) => {
  return (
    <div className="rounded-2xl odd:bg-lamaPurple even:bg-lamaYellow p-4 flex-1 min-w-[130px]">
      <div className="flex justify-between items-center">
        <span className="text-[10px] bg-white px-2 py-1 rounded-full text-green-600">
          2024/25
        </span>
        <Image src="/more.png" alt="" width={20} height={20} />
      </div>
      <h1 className="text-2xl font-semibold my-4">{count}</h1>
      <h2 className="capitalize text-sm font-medium text-gray-500">
        {subtitle || `${type}s`}
      </h2>
    </div>
  );
};

export default UserCardClient;
