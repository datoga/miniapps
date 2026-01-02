"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { allVerbs } from "../lib/verbData";
import { VerbCard } from "./VerbCard";

export const FindTab = memo(function FindTab() {
  const [query, setQuery] = useState("");

  const handleQueryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  }, []);

  const results = useMemo(() => {
    if (query.trim().length === 0) {
      return null;
    }

    const lowerQuery = query.toLowerCase().trim();
    return allVerbs.filter(
      (v) =>
        v.present.toLowerCase().includes(lowerQuery) ||
        v.past.toLowerCase().includes(lowerQuery) ||
        v.participle.toLowerCase().includes(lowerQuery) ||
        v.meaning.toLowerCase().includes(lowerQuery)
    );
  }, [query]);

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleQueryChange}
          placeholder="Search verb or translation..."
          className="w-full rounded-2xl border border-slate-100 bg-white p-4 pl-12 font-medium text-slate-700 shadow-sm focus:border-indigo-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          autoFocus
        />
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">🔍</span>
      </div>

      {/* Results */}
      <div className="space-y-2">
        {results !== null && results.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-400">No results found</p>
        )}
        {results?.map((verb) => (
          <VerbCard key={verb.present} verb={verb} />
        ))}
      </div>
    </div>
  );
});
