"use client";

import { useTranslations } from "next-intl";
import { memo, useCallback, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import type { Note } from "../lib/schemas";

const NOTE_COLORS = ["yellow", "pink", "blue", "green", "purple"] as const;
type NoteColor = (typeof NOTE_COLORS)[number];

const colorStyles: Record<NoteColor, string> = {
  yellow: "bg-yellow-100 dark:bg-yellow-900/40 border-yellow-200 dark:border-yellow-800",
  pink: "bg-pink-100 dark:bg-pink-900/40 border-pink-200 dark:border-pink-800",
  blue: "bg-blue-100 dark:bg-blue-900/40 border-blue-200 dark:border-blue-800",
  green: "bg-green-100 dark:bg-green-900/40 border-green-200 dark:border-green-800",
  purple: "bg-purple-100 dark:bg-purple-900/40 border-purple-200 dark:border-purple-800",
};

const colorDots: Record<NoteColor, string> = {
  yellow: "bg-yellow-400",
  pink: "bg-pink-400",
  blue: "bg-blue-400",
  green: "bg-green-400",
  purple: "bg-purple-400",
};

interface NoteInputProps {
  notes: Note[];
  onChange: (notes: Note[]) => void;
}

export const NoteInput = memo(function NoteInput({ notes, onChange }: NoteInputProps) {
  const t = useTranslations();
  const [newNoteText, setNewNoteText] = useState("");
  const [selectedColor, setSelectedColor] = useState<NoteColor>("yellow");

  const handleAddNote = useCallback(() => {
    if (!newNoteText.trim()) {return;}

    const newNote: Note = {
      id: uuidv4(),
      text: newNoteText.trim(),
      color: selectedColor,
      createdAt: new Date().toISOString(),
    };

    onChange([...notes, newNote]);
    setNewNoteText("");
  }, [newNoteText, selectedColor, notes, onChange]);

  const handleRemoveNote = useCallback(
    (id: string) => {
      onChange(notes.filter((n) => n.id !== id));
    },
    [notes, onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleAddNote();
      }
    },
    [handleAddNote]
  );

  return (
    <div className="space-y-3">
      {/* Existing notes as post-its */}
      {notes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {notes.map((note) => (
            <div
              key={note.id}
              className={`relative p-3 rounded-lg border shadow-sm max-w-[200px] ${colorStyles[note.color as NoteColor]}`}
              style={{ transform: `rotate(${Math.random() * 4 - 2}deg)` }}
            >
              <button
                type="button"
                onClick={() => handleRemoveNote(note.id)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-gray-500 hover:bg-red-500 text-white rounded-full text-xs flex items-center justify-center transition-colors"
              >
                ×
              </button>
              <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap break-words">
                {note.text}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Add new note */}
      <div className="flex gap-2">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("mentee.notesPlaceholder")}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
          {/* Color picker */}
          <div className="flex items-center gap-1 px-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
            {NOTE_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setSelectedColor(color)}
                className={`w-5 h-5 rounded-full ${colorDots[color]} ${
                  selectedColor === color ? "ring-2 ring-offset-1 ring-gray-400" : ""
                }`}
              />
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={handleAddNote}
          disabled={!newNoteText.trim()}
          className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          +
        </button>
      </div>
    </div>
  );
});
