"use client";

import { memo, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { v4 as uuidv4 } from "uuid";
import type { Goal } from "../lib/schemas";

interface GoalInputProps {
  goals: Goal[];
  onChange: (goals: Goal[]) => void;
}

export const GoalInput = memo(function GoalInput({ goals, onChange }: GoalInputProps) {
  const t = useTranslations();
  const [newGoalText, setNewGoalText] = useState("");

  const handleAddGoal = useCallback(() => {
    if (!newGoalText.trim()) return;

    const newGoal: Goal = {
      id: uuidv4(),
      text: newGoalText.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    };

    onChange([...goals, newGoal]);
    setNewGoalText("");
  }, [newGoalText, goals, onChange]);

  const handleRemoveGoal = useCallback(
    (id: string) => {
      onChange(goals.filter((g) => g.id !== id));
    },
    [goals, onChange]
  );

  const handleToggleGoal = useCallback(
    (id: string) => {
      onChange(
        goals.map((g) =>
          g.id === id ? { ...g, completed: !g.completed } : g
        )
      );
    },
    [goals, onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAddGoal();
      }
    },
    [handleAddGoal]
  );

  const completedCount = goals.filter((g) => g.completed).length;
  const totalCount = goals.length;

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{t("mentee.goalsProgress")}</span>
            <span>{completedCount}/{totalCount}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div
              className="h-1.5 rounded-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-300"
              style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Goal list */}
      {goals.length > 0 && (
        <ul className="space-y-2">
          {goals.map((goal) => (
            <li key={goal.id} className="flex items-start gap-3 group">
              <button
                type="button"
                onClick={() => handleToggleGoal(goal.id)}
                className="flex-shrink-0 mt-0.5 hover:scale-110 transition-transform"
              >
                {goal.completed ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                ) : (
                  <div className="w-[18px] h-[18px] rounded-full border-2 border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500 transition-colors" />
                )}
              </button>
              <span className={`flex-1 text-sm leading-relaxed ${
                goal.completed 
                  ? "text-gray-400 line-through" 
                  : "text-gray-700 dark:text-gray-300"
              }`}>
                {goal.text}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveGoal(goal.id)}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all flex-shrink-0"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Add new goal */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newGoalText}
          onChange={(e) => setNewGoalText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("mentee.goalPlaceholder")}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
        <button
          type="button"
          onClick={handleAddGoal}
          disabled={!newGoalText.trim()}
          className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
        >
          +
        </button>
      </div>
    </div>
  );
});

