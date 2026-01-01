"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";

interface EditableFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
  displayClassName?: string;
  inputClassName?: string;
  defaultEditing?: boolean;
}

export const EditableField = memo(function EditableField({
  value,
  onChange,
  placeholder = "Click to edit...",
  multiline = false,
  className = "",
  displayClassName = "",
  inputClassName = "",
  defaultEditing = false,
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(defaultEditing);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      // Move cursor to end
      const length = editValue.length;
      inputRef.current.setSelectionRange(length, length);
    }
  }, [isEditing, editValue.length]);

  const handleClick = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    if (editValue !== value) {
      onChange(editValue);
    }
  }, [editValue, value, onChange]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      // Select all text when entering edit mode for quick replacement
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        if (!multiline) {
          e.preventDefault();
          setIsEditing(false);
          onChange(editValue);
        }
      } else if (e.key === "Escape") {
        setEditValue(value);
        setIsEditing(false);
      }
    },
    [onChange, editValue, multiline, value]
  );

  if (isEditing) {
    const commonProps = {
      ref: inputRef as React.RefObject<HTMLInputElement & HTMLTextAreaElement>,
      value: editValue,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setEditValue(e.target.value),
      onBlur: handleBlur,
      onKeyDown: handleKeyDown,
      placeholder,
      className: `w-full bg-transparent focus:outline-none focus:ring-2 focus:ring-primary-500/50 rounded-lg transition-all ${
        multiline
          ? "border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 p-4 min-h-[120px] resize-y"
          : "border-b-2 border-primary-400 px-1 py-0.5"
      } ${className} ${inputClassName}`,
    };

    if (multiline) {
      return <textarea {...commonProps} />;
    }

    return <input type="text" {...commonProps} />;
  }

  return (
    <div
      onClick={handleClick}
      className={`group cursor-pointer rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 relative ${
        multiline ? "w-full p-4 items-start" : "px-1 -mx-1 inline-flex items-center gap-2"
      } flex ${className} ${displayClassName}`}
      title="Click to edit"
    >
      <div className={`flex-1 ${multiline ? "whitespace-pre-wrap break-words" : "truncate"}`}>
        {value || <span className="text-gray-400 italic">{placeholder}</span>}
      </div>
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className={`text-gray-400 flex-shrink-0 transition-opacity ${
          multiline
            ? "opacity-0 group-hover:opacity-100 absolute top-4 right-4"
            : "opacity-0 group-hover:opacity-50"
        }`}
      >
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
        <path d="m15 5 4 4" />
      </svg>
    </div>
  );
});
