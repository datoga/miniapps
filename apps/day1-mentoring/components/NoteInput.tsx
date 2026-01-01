"use client";

import { useTranslations } from "next-intl";
import { memo, useCallback, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import type { Note } from "../lib/schemas";

const NOTE_COLORS = ["yellow", "pink", "blue", "green", "purple"] as const;
type NoteColor = (typeof NOTE_COLORS)[number];

const colorStyles: Record<NoteColor, { bg: string; pin: string }> = {
  yellow: {
    bg: "bg-yellow-100 dark:bg-yellow-900/50",
    pin: "bg-red-500"
  },
  pink: {
    bg: "bg-pink-100 dark:bg-pink-900/50",
    pin: "bg-red-600"
  },
  blue: {
    bg: "bg-blue-100 dark:bg-blue-900/50",
    pin: "bg-red-500"
  },
  green: {
    bg: "bg-green-100 dark:bg-green-900/50",
    pin: "bg-red-600"
  },
  purple: {
    bg: "bg-purple-100 dark:bg-purple-900/50",
    pin: "bg-red-500"
  },
};

const colorDots: Record<NoteColor, string> = {
  yellow: "bg-yellow-400 hover:bg-yellow-500",
  pink: "bg-pink-400 hover:bg-pink-500",
  blue: "bg-blue-400 hover:bg-blue-500",
  green: "bg-green-400 hover:bg-green-500",
  purple: "bg-purple-400 hover:bg-purple-500",
};

interface NoteInputProps {
  notes: Note[];
  onChange: (notes: Note[]) => void;
}

export const NoteInput = memo(function NoteInput({ notes, onChange }: NoteInputProps) {
  const t = useTranslations();
  const [newNoteText, setNewNoteText] = useState("");
  const [selectedColor, setSelectedColor] = useState<NoteColor>("yellow");
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Generate stable rotations based on note id
  const rotations = useMemo(() => {
    const map: Record<string, number> = {};
    notes.forEach((note, index) => {
      // Use a simple hash based on id and index for stable rotation
      const hash = note.id.charCodeAt(0) + index;
      map[note.id] = (hash % 5) - 2; // -2 to 2 degrees
    });
    return map;
  }, [notes]);

  const handleAddNote = useCallback(() => {
    if (!newNoteText.trim()) return;

    const newNote: Note = {
      id: uuidv4(),
      text: newNoteText.trim(),
      color: selectedColor,
      createdAt: new Date().toISOString(),
    };

    onChange([...notes, newNote]);
    setNewNoteText("");
    setShowColorPicker(false);
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
    <div className="space-y-4">
      {/* Existing notes as post-its */}
      {notes.length > 0 && (
        <div className="flex flex-wrap gap-4">
          {notes.map((note) => {
            const noteColor = (note.color as NoteColor) || "yellow";
            const rotation = rotations[note.id] || 0;

            return (
              <div
                key={note.id}
                className={`relative group min-w-[160px] max-w-[220px] ${colorStyles[noteColor].bg} shadow-md hover:shadow-lg transition-shadow`}
                style={{
                  transform: `rotate(${rotation}deg)`,
                  clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)"
                }}
              >
                {/* Pushpin */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10">
                  <div className={`w-4 h-4 rounded-full ${colorStyles[noteColor].pin} shadow-md`}>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white/60" />
                  </div>
                </div>

                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => handleRemoveNote(note.id)}
                  className="absolute top-1 right-1 w-5 h-5 bg-gray-400/50 hover:bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                >
                  ×
                </button>

                {/* Note content */}
                <div className="pt-8 pb-5 px-4">
                  <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap break-words leading-relaxed">
                    {note.text}
                  </p>
                </div>

                {/* Folded corner effect */}
                <div
                  className="absolute bottom-0 right-0 w-0 h-0"
                  style={{
                    borderStyle: "solid",
                    borderWidth: "0 0 10px 10px",
                    borderColor: "transparent transparent rgba(0,0,0,0.1) transparent"
                  }}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Add new note */}
      <div className="flex gap-2 items-center">
        <input
          type="text"
          value={newNoteText}
          onChange={(e) => setNewNoteText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("mentee.notesPlaceholder")}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />

        {/* Color picker toggle */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowColorPicker(!showColorPicker)}
            className={`w-8 h-8 rounded-lg ${colorDots[selectedColor]} shadow-sm transition-transform hover:scale-110`}
            title={t("mentee.noteColor")}
          />

          {/* Color picker dropdown */}
          {showColorPicker && (
            <div className="absolute bottom-full right-0 mb-2 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 flex gap-1.5 z-10">
              {NOTE_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => {
                    setSelectedColor(color);
                    setShowColorPicker(false);
                  }}
                  className={`w-6 h-6 rounded-full ${colorDots[color]} ${
                    selectedColor === color ? "ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-800" : ""
                  } transition-transform hover:scale-110`}
                />
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleAddNote}
          disabled={!newNoteText.trim()}
          className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
        >
          +
        </button>
      </div>
    </div>
  );
});
