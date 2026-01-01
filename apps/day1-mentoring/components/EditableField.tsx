"use client";

import { memo, useState, useCallback, useRef, useEffect } from "react";

interface EditableFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
  displayClassName?: string;
  inputClassName?: string;
}

export const EditableField = memo(function EditableField({
  value,
  onChange,
  placeholder = "Click to edit...",
  multiline = false,
  className = "",
  displayClassName = "",
  inputClassName = "",
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
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

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !multiline) {
        e.preventDefault();
        handleBlur();
      }
      if (e.key === "Escape") {
        setEditValue(value);
        setIsEditing(false);
      }
    },
    [handleBlur, multiline, value]
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
      className: `w-full bg-transparent border-b-2 border-primary-400 focus:outline-none focus:border-primary-500 ${inputClassName}`,
    };

    if (multiline) {
      return (
        <div className={className}>
          <textarea {...commonProps} rows={3} />
        </div>
      );
    }

    return (
      <div className={className}>
        <input type="text" {...commonProps} />
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      className={`cursor-pointer rounded px-1 -mx-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${className} ${displayClassName}`}
      title="Click to edit"
    >
      {value || <span className="text-gray-400 italic">{placeholder}</span>}
    </div>
  );
});

