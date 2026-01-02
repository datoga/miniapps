"use client";

import { memo, useCallback, useState } from "react";
import { verbData } from "../lib/verbData";
import { VerbCard } from "./VerbCard";

export const LearnTab = memo(function LearnTab() {
  const [activeGroup, setActiveGroup] = useState(verbData[0]?.id ?? "");

  const handleGroupChange = useCallback((id: string) => {
    setActiveGroup(id);
  }, []);

  const currentGroup = verbData.find((g) => g.id === activeGroup);

  return (
    <div className="space-y-4">
      {/* Group Selector */}
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-2">
        {verbData.map((group) => (
          <button
            key={group.id}
            type="button"
            onClick={() => handleGroupChange(group.id)}
            className={`whitespace-nowrap rounded-full border-2 px-5 py-2 text-[10px] font-extrabold transition-all ${
              activeGroup === group.id
                ? "border-indigo-600 bg-indigo-600 text-white shadow-md"
                : "border-slate-100 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-800"
            }`}
          >
            {group.label} <span className="font-normal opacity-50">({group.verbs.length})</span>
          </button>
        ))}
      </div>

      {/* Verb Cards */}
      <div className="space-y-2">
        {currentGroup?.verbs.map((verb) => (
          <VerbCard key={verb.present} verb={verb} />
        ))}
      </div>
    </div>
  );
});
