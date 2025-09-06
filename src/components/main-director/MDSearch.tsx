"use client";

import { useState } from "react";
import Image from "next/image";

interface MDSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

const MDSearch = ({ onSearch, placeholder = "Search..." }: MDSearchProps) => {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <div className="flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-purple-300 px-2 bg-white">
        <Image src="/search.png" alt="" width={14} height={14} />
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-[200px] p-2 bg-transparent outline-none"
        />
      </div>
      <button
        type="submit"
        className="bg-purple-600 text-white px-3 py-2 rounded text-sm hover:bg-purple-700"
      >
        Search
      </button>
    </form>
  );
};

export default MDSearch;
