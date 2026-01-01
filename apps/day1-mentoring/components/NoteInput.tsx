"use client";

import { useTranslations } from "next-intl";
import { memo, useCallback, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import type { Note } from "../lib/schemas";

interface NoteInputProps {
  notes: Note[];
  onChange: (notes: Note[]) => void;
}

export const NoteInput = memo(function NoteInput({ notes, onChange }: NoteInputProps) {
  const t = useTranslations();
  const [newNoteText, setNewNoteText] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  const handleAddNote = useCallback(() => {
    if (!newNoteText.trim()) {
      return;
    }

    const newNote: Note = {
      id: uuidv4(),
      text: newNoteText.trim(),
      color: "blue",
      createdAt: new Date().toISOString(),
    };

    onChange([...notes, newNote]);
    setNewNoteText("");
  }, [newNoteText, notes, onChange]);

  const handleRemoveNote = useCallback(
    (id: string) => {
      onChange(notes.filter((n) => n.id !== id));
    },
    [notes, onChange]
  );

  const handleSaveEdit = useCallback(() => {
    if (!editingNoteId) {
      return;
    }

    if (editingText.trim()) {
      onChange(notes.map((n) => (n.id === editingNoteId ? { ...n, text: editingText.trim() } : n)));
    }
    setEditingNoteId(null);
    setEditingText("");
  }, [editingNoteId, editingText, notes, onChange]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        {notes.map((note) => (
          <div
            key={note.id}
            className="group relative p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 transition-all hover:shadow-md"
          >
            <button
              onClick={() => handleRemoveNote(note.id)}
              className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-white/50 transition-all opacity-0 group-hover:opacity-100"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {editingNoteId === note.id ? (
              <textarea
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
                onBlur={handleSaveEdit}
                autoFocus
                rows={3}
                className="w-full bg-transparent border-none outline-none resize-none text-sm text-gray-700 dark:text-gray-200 leading-relaxed font-medium"
              />
            ) : (
              <div
                onClick={() => {
                  setEditingNoteId(note.id);
                  setEditingText(note.text);
                }}
                className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words leading-relaxed cursor-text min-h-[60px]"
              >
                {note.text}
              </div>
            )}

            <p className="mt-2 text-[10px] text-amber-500/70 font-medium text-right">
              {new Date(note.createdAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>

      <div className="relative">
        <textarea
          value={newNoteText}
          onChange={(e) => setNewNoteText(e.target.value)}
          placeholder={t("mentee.notesPlaceholder")}
          rows={3}
          className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none shadow-sm placeholder:text-gray-400"
        />
        <div className="flex justify-end mt-2">
          <button
            type="button"
            onClick={handleAddNote}
            disabled={!newNoteText.trim()}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-xs font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("mentee.addNote")}
          </button>
        </div>
      </div>
    </div>
  );
});
