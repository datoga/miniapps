"use client";

import { memo, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { v4 as uuidv4 } from "uuid";
import type { Goal, ActionStep } from "../lib/schemas";

interface GoalInputProps {
  goals: Goal[];
  onChange: (goals: Goal[]) => void;
}

export const GoalInput = memo(function GoalInput({ goals, onChange }: GoalInputProps) {
  const t = useTranslations();
  const [newGoalText, setNewGoalText] = useState("");
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
  const [newActionTexts, setNewActionTexts] = useState<Record<string, string>>({});

  const handleAddGoal = useCallback(() => {
    if (!newGoalText.trim()) return;

    const newGoal: Goal = {
      id: uuidv4(),
      text: newGoalText.trim(),
      completed: false,
      actions: [],
      createdAt: new Date().toISOString(),
    };

    onChange([...goals, newGoal]);
    setNewGoalText("");
    setExpandedGoalId(newGoal.id); // Expand the new goal to add actions
  }, [newGoalText, goals, onChange]);

  const handleRemoveGoal = useCallback(
    (id: string) => {
      onChange(goals.filter((g) => g.id !== id));
      if (expandedGoalId === id) {
        setExpandedGoalId(null);
      }
    },
    [goals, onChange, expandedGoalId]
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

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedGoalId(expandedGoalId === id ? null : id);
  }, [expandedGoalId]);

  // Action handlers
  const handleAddAction = useCallback(
    (goalId: string) => {
      const actionText = newActionTexts[goalId]?.trim();
      if (!actionText) return;

      const newAction: ActionStep = {
        id: uuidv4(),
        text: actionText,
        done: false,
      };

      onChange(
        goals.map((g) =>
          g.id === goalId ? { ...g, actions: [...(g.actions || []), newAction] } : g
        )
      );
      setNewActionTexts((prev) => ({ ...prev, [goalId]: "" }));
    },
    [goals, onChange, newActionTexts]
  );

  const handleRemoveAction = useCallback(
    (goalId: string, actionId: string) => {
      onChange(
        goals.map((g) =>
          g.id === goalId
            ? { ...g, actions: g.actions.filter((a) => a.id !== actionId) }
            : g
        )
      );
    },
    [goals, onChange]
  );

  const handleToggleAction = useCallback(
    (goalId: string, actionId: string) => {
      onChange(
        goals.map((g) =>
          g.id === goalId
            ? {
                ...g,
                actions: g.actions.map((a) =>
                  a.id === actionId ? { ...a, done: !a.done } : a
                ),
              }
            : g
        )
      );
    },
    [goals, onChange]
  );

  const handleGoalKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAddGoal();
      }
    },
    [handleAddGoal]
  );

  const handleActionKeyDown = useCallback(
    (e: React.KeyboardEvent, goalId: string) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAddAction(goalId);
      }
    },
    [handleAddAction]
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
          {goals.map((goal) => {
            const isExpanded = expandedGoalId === goal.id;
            const actionsCompleted = goal.actions?.filter((a) => a.done).length || 0;
            const actionsTotal = goal.actions?.length || 0;

            return (
              <li key={goal.id} className="group">
                <div className="flex items-start gap-3">
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
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm leading-relaxed ${
                        goal.completed 
                          ? "text-gray-400 line-through" 
                          : "text-gray-700 dark:text-gray-300"
                      }`}>
                        {goal.text}
                      </span>
                      {actionsTotal > 0 && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          ({actionsCompleted}/{actionsTotal})
                        </span>
                      )}
                    </div>
                    
                    {/* Expand/collapse button */}
                    <button
                      type="button"
                      onClick={() => handleToggleExpand(goal.id)}
                      className="mt-1 text-xs text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 flex items-center gap-1"
                    >
                      <svg 
                        width="12" 
                        height="12" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2"
                        className={`transition-transform ${isExpanded ? "rotate-90" : ""}`}
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                      {t("mentee.actionPlan")} {actionsTotal > 0 && `(${actionsTotal})`}
                    </button>

                    {/* Action items (expanded) */}
                    {isExpanded && (
                      <div className="mt-2 ml-1 pl-3 border-l-2 border-gray-200 dark:border-gray-700 space-y-2">
                        {goal.actions && goal.actions.length > 0 && (
                          <ul className="space-y-1.5">
                            {goal.actions.map((action) => (
                              <li key={action.id} className="flex items-center gap-2 group/action">
                                <button
                                  type="button"
                                  onClick={() => handleToggleAction(goal.id, action.id)}
                                  className="flex-shrink-0 hover:scale-110 transition-transform"
                                >
                                  {action.done ? (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500">
                                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                      <polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                  ) : (
                                    <div className="w-3.5 h-3.5 rounded border-2 border-gray-300 dark:border-gray-600 hover:border-primary-400 transition-colors" />
                                  )}
                                </button>
                                <span className={`flex-1 text-xs ${
                                  action.done ? "text-gray-400 line-through" : "text-gray-600 dark:text-gray-400"
                                }`}>
                                  {action.text}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAction(goal.id, action.id)}
                                  className="opacity-0 group-hover/action:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                  </svg>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}

                        {/* Add action input */}
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={newActionTexts[goal.id] || ""}
                            onChange={(e) => setNewActionTexts((prev) => ({ ...prev, [goal.id]: e.target.value }))}
                            onKeyDown={(e) => handleActionKeyDown(e, goal.id)}
                            placeholder={t("mentee.addActionPlaceholder")}
                            className="flex-1 rounded border border-gray-200 dark:border-gray-700 px-2 py-1 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary-400 dark:bg-gray-800 dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddAction(goal.id)}
                            disabled={!newActionTexts[goal.id]?.trim()}
                            className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
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
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Add new goal */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newGoalText}
          onChange={(e) => setNewGoalText(e.target.value)}
          onKeyDown={handleGoalKeyDown}
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
