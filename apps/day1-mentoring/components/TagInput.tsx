"use client";

import { memo, useState, useCallback } from "react";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export const TagInput = memo(function TagInput({
  tags,
  onChange,
  placeholder = "Add a tag",
}: TagInputProps) {
  const [input, setInput] = useState("");

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        const tag = input.trim().toLowerCase();
        if (tag && !tags.includes(tag)) {
          onChange([...tags, tag]);
        }
        setInput("");
      } else if (e.key === "Backspace" && !input && tags.length > 0) {
        onChange(tags.slice(0, -1));
      }
    },
    [input, tags, onChange]
  );

  const handleRemove = useCallback(
    (tagToRemove: string) => {
      onChange(tags.filter((t) => t !== tagToRemove));
    },
    [tags, onChange]
  );

  return (
    <div className="flex flex-wrap gap-2 rounded-lg border border-gray-300 bg-white p-2 dark:border-gray-600 dark:bg-gray-800">
      {tags.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1 rounded-full bg-primary-100 px-2 py-0.5 text-sm text-primary-800 dark:bg-primary-900/30 dark:text-primary-300"
        >
          {tag}
          <button
            type="button"
            onClick={() => handleRemove(tag)}
            className="ml-1 rounded-full hover:bg-primary-200 dark:hover:bg-primary-800"
          >
            ×
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? placeholder : ""}
        className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-500 outline-none dark:text-white dark:placeholder-gray-400"
        style={{ minWidth: "80px" }}
      />
    </div>
  );
});

