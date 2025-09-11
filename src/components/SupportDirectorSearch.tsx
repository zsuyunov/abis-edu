/*
"use client";

import Image from "next/image";
import { useState } from "react";

const SupportDirectorSearch = ({ 
  onSearch, 
  placeholder = "Search..." 
}: { 
  onSearch: (value: string) => void;
  placeholder?: string;
}) => {
  const [value, setValue] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSearch(value.trim());
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full md:w-auto flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 px-2"
    >
      <Image src="/search.png" alt="" width={14} height={14} />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-[200px] p-2 bg-transparent outline-none"
      />
    </form>
  );
};

export default SupportDirectorSearch;


*/