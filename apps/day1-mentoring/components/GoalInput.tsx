"use client";

import { trackEvent } from "@miniapps/analytics";
import { useTranslations } from "next-intl";
import { memo, useCallback, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import type { Goal } from "../lib/schemas";
import { EditableField } from "./EditableField";

interface GoalInputProps {
  goals: Goal[];
  onChange: (goals: Goal[]) => void;
}

export const GoalInput = memo(function GoalInput({ goals, onChange }: GoalInputProps) {
  const t = useTranslations();
  const [isAdding, setIsAdding] = useState(false);
  const [newGoalText, setNewGoalText] = useState("");

  const handleAddGoal = useCallback(() => {
    if (!newGoalText.trim()) {
      return;
    }

    const newGoal: Goal = {
      id: uuidv4(),
      text: newGoalText.trim(),
      completed: false,
      actions: [],
      createdAt: new Date().toISOString(),
    };

    onChange([newGoal, ...goals]);
    setNewGoalText("");
    setIsAdding(false);
    trackEvent("goal_created", {
      text_length: newGoalText.trim().length,
      total_goals: goals.length + 1,
    });
  }, [newGoalText, goals, onChange]);

  const removeGoal = useCallback(
    (id: string) => {
      onChange(goals.filter((g) => g.id !== id));
    },
    [goals, onChange]
  );

  const updateGoal = useCallback(
    (id: string, updates: Partial<Goal>) => {
      onChange(goals.map((g) => (g.id === id ? { ...g, ...updates } : g)));
    },
    [goals, onChange]
  );

  return (
    <div className="space-y-6">
      {/* Add Button */}
      {!isAdding ? (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full py-3 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-medium text-gray-500 hover:text-primary-600 hover:border-primary-200 hover:bg-primary-50/30 transition-all flex items-center justify-center gap-2"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {t("mentee.goalPlaceholder")}
        </button>
      ) : (
        <div className="flex gap-2 animate-in fade-in slide-in-from-top-2">
          <input
            autoFocus
            type="text"
            value={newGoalText}
            onChange={(e) => setNewGoalText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddGoal()}
            placeholder={t("mentee.goalPlaceholder")}
            className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          />
          <button
            onClick={handleAddGoal}
            className="px-4 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors"
          >
            OK
          </button>
          <button
            onClick={() => setIsAdding(false)}
            className="px-4 bg-gray-100 text-gray-500 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {/* Goals List */}
      <div className="space-y-4">
        {goals.map((goal) => (
          <div
            key={goal.id}
            className={`group p-5 rounded-2xl border transition-all ${
              goal.completed
                ? "bg-emerald-50/50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30 opacity-75"
                : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:shadow-md hover:border-gray-200"
            }`}
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1">
                <EditableField
                  value={goal.text}
                  onChange={(v) => updateGoal(goal.id, { text: v })}
                  className={`font-semibold text-base ${
                    goal.completed
                      ? "text-emerald-700 line-through"
                      : "text-gray-900 dark:text-gray-100"
                  }`}
                />
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => updateGoal(goal.id, { completed: !goal.completed })}
                  className={`p-2 rounded-lg transition-colors ${
                    goal.completed
                      ? "text-emerald-600 bg-emerald-100"
                      : "text-gray-400 hover:bg-gray-100"
                  }`}
                  title={goal.completed ? "Marcar pendiente" : "Marcar completado"}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </button>
                <button
                  onClick={() => removeGoal(goal.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Description Field */}
            <div className="mt-2 pl-1 border-t border-gray-50 dark:border-gray-800/50 pt-2">
              <EditableField
                value={goal.description || ""}
                onChange={(v) => updateGoal(goal.id, { description: v })}
                placeholder="Añadir descripción, plan de acción..."
                multiline
                className={`text-sm ${
                  goal.completed ? "text-emerald-600/70" : "text-gray-600 dark:text-gray-400"
                }`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
