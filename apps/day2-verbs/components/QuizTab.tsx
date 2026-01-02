"use client";

import { memo, useState, useCallback, useEffect, useMemo, useRef } from "react";
import { verbData, type Verb } from "../lib/verbData";
import type { Stats } from "../lib/useStats";
import { ConfirmModal } from "./ConfirmModal";

type VerbField = "present" | "past" | "participle" | "meaning";

interface QuizState {
  verb: Verb | null;
  clueType: VerbField | null;
  missing: VerbField[];
  counted: boolean;
}

const labels: Record<VerbField, string> = {
  present: "Present",
  past: "Past",
  participle: "Participle",
  meaning: "Translation",
};

// Input state styles to avoid nested ternaries
const inputStateStyles: Record<string, string> = {
  correct: "border-green-500 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  incorrect: "border-rose-400 text-rose-500 dark:bg-rose-900/30 dark:text-rose-400",
  skipped: "border-amber-400 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  default: "border-slate-200 text-slate-800 focus:border-indigo-400 dark:border-slate-500 dark:text-white dark:focus:border-indigo-400",
};

// Feedback styles to avoid nested ternaries
const feedbackStyles: Record<string, string> = {
  correct: "border-y-2 border-green-300 text-green-500 dark:border-green-700 dark:bg-green-900/30 dark:text-green-400",
  incorrect: "border-y-2 border-rose-300 text-rose-500 dark:border-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  skipped: "border-y-2 border-amber-300 text-amber-500 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

interface QuizTabProps {
  stats: Stats;
  onSuccess: (verb: Verb) => void;
  onFail: (verb: Verb) => void;
  onReset: () => void;
  onRemoveHistoryItem: (index: number) => void;
}

export const QuizTab = memo(function QuizTab({
  stats,
  onSuccess,
  onFail,
  onReset,
  onRemoveHistoryItem,
}: QuizTabProps) {
  const [enabledGroups, setEnabledGroups] = useState<string[]>(
    verbData.map((g) => g.id)
  );
  const [showCategories, setShowCategories] = useState(false);
  const [quizState, setQuizState] = useState<QuizState>({
    verb: null,
    clueType: null,
    missing: [],
    counted: false,
  });
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | "skipped" | null>(null);
  const [inputStates, setInputStates] = useState<Record<string, "correct" | "incorrect" | "skipped" | null>>({});
  const [buttonsLocked, setButtonsLocked] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: "delete" | "reset";
    itemIndex?: number;
  }>({ isOpen: false, type: "reset" });

  const firstInputRef = useRef<HTMLInputElement>(null);

  const filteredVerbs = useMemo(() => {
    return verbData
      .filter((g) => enabledGroups.includes(g.id))
      .flatMap((g) => g.verbs);
  }, [enabledGroups]);

  const setupQuiz = useCallback(() => {
    // Count appearances of each verb in history
    const appearanceCount = new Map<string, number>();
    stats.history.forEach((h) => {
      const count = appearanceCount.get(h.verb.present) || 0;
      appearanceCount.set(h.verb.present, count + 1);
    });

    // Get failed verbs (unique, not accumulated)
    const failedVerbs = new Set(
      stats.history.filter((h) => h.status === "fail").map((h) => h.verb.present)
    );

    // Find max appearances to calculate inverse weight
    const maxAppearances = Math.max(1, ...Array.from(appearanceCount.values()));

    // Calculate weights: less appearances = higher weight, failed = small bonus
    const weightedVerbs: { verb: Verb; weight: number }[] = filteredVerbs.map((v) => {
      const appearances = appearanceCount.get(v.present) || 0;
      // Base weight: inverse of appearances (0 appearances = max weight)
      const baseWeight = maxAppearances - appearances + 1;
      // Small bonus for failed verbs (not accumulated)
      const failBonus = failedVerbs.has(v.present) ? 2 : 0;
      return { verb: v, weight: baseWeight + failBonus };
    });

    // Weighted random selection
    const totalWeight = weightedVerbs.reduce((sum, v) => sum + v.weight, 0);
    let random = Math.random() * totalWeight;
    let selectedVerb = weightedVerbs[0]?.verb;

    for (const { verb, weight } of weightedVerbs) {
      random -= weight;
      if (random <= 0) {
        selectedVerb = verb;
        break;
      }
    }

    const types: VerbField[] = ["present", "past", "participle", "meaning"];
    const clueIndex = Math.floor(Math.random() * 4);
    const clueType = types[clueIndex] ?? "present";
    const missing = types.filter((_, i) => i !== clueIndex);

    if (!selectedVerb) {return;}
    setQuizState({ verb: selectedVerb, clueType, missing, counted: false });
    setInputs({});
    setFeedback(null);
    setInputStates({});
    setButtonsLocked(false);

    // Focus first input after state update
    setTimeout(() => {
      firstInputRef.current?.focus();
    }, 0);
  }, [filteredVerbs, stats.history]);

  // Setup quiz on mount and when filters change
  useEffect(() => {
    if (filteredVerbs.length > 0) {
      setupQuiz();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Intentionally only re-setup when categories change
  }, [enabledGroups.length]);

  // Initial setup
  useEffect(() => {
    if (filteredVerbs.length > 0 && !quizState.verb) {
      setupQuiz();
    }
  }, [setupQuiz, filteredVerbs.length, quizState.verb]);

  const handleInputChange = useCallback((field: VerbField, value: string) => {
    setInputs((prev) => ({ ...prev, [field]: value }));
  }, []);

  const toggleGroup = useCallback((id: string) => {
    setEnabledGroups((prev) => {
      if (prev.includes(id)) {
        if (prev.length > 1) {
          return prev.filter((g) => g !== id);
        }
        return prev;
      }
      return [...prev, id];
    });
  }, []);

  const checkAnswer = useCallback(() => {
    const verb = quizState.verb;
    if (!verb) { return; }

    let isCorrect = true;
    const newInputStates: Record<string, "correct" | "incorrect" | null> = {};

    quizState.missing.forEach((type) => {
      const val = (inputs[type] || "").trim().toLowerCase();
      const original = verb[type].toLowerCase();
      const correctForms = [...original.split("/"), original];

      if (correctForms.includes(val)) {
        newInputStates[type] = "correct";
      } else {
        newInputStates[type] = "incorrect";
        isCorrect = false;
      }
    });

    setInputStates(newInputStates);

    if (isCorrect) {
      if (!quizState.counted) {
        onSuccess(verb);
        setQuizState((prev) => ({ ...prev, counted: true }));
      }
      setFeedback("correct");
      setButtonsLocked(true);
      setTimeout(setupQuiz, 2000);
    } else {
      if (!quizState.counted) {
        onFail(verb);
        setQuizState((prev) => ({ ...prev, counted: true }));
      }
      setFeedback("incorrect");
      setTimeout(() => setFeedback(null), 5000);
    }
  }, [quizState, inputs, onSuccess, onFail, setupQuiz]);

  const giveUp = useCallback(() => {
    const verb = quizState.verb;
    if (!verb) { return; }

    if (!quizState.counted) {
      onFail(verb);
      setQuizState((prev) => ({ ...prev, counted: true }));
    }

    // Show answers
    const newInputs: Record<string, string> = {};
    const newInputStates: Record<string, "correct" | "incorrect" | "skipped" | null> = {};
    quizState.missing.forEach((type) => {
      newInputs[type] = verb[type];
      newInputStates[type] = "skipped";
    });

    setInputs(newInputs);
    setInputStates(newInputStates);
    setFeedback("skipped");
    setButtonsLocked(true);
    setTimeout(setupQuiz, 5000);
  }, [quizState, onFail, setupQuiz]);

  const handleConfirmAction = useCallback(() => {
    if (confirmModal.type === "reset") {
      onReset();
    } else if (confirmModal.type === "delete" && confirmModal.itemIndex !== undefined) {
      onRemoveHistoryItem(confirmModal.itemIndex);
    }
    setConfirmModal({ isOpen: false, type: "reset" });
  }, [confirmModal, onReset, onRemoveHistoryItem]);

  const categoriesCount = enabledGroups.length === verbData.length
    ? "(all)"
    : `(${enabledGroups.length})`;

  if (!quizState.verb) {
    return (
      <div className="py-8 text-center text-slate-400">
        Loading...
      </div>
    );
  }

  const currentVerb = quizState.verb;

  return (
    <div className="space-y-4 pb-24">
      {/* Categories Filter */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <button
          type="button"
          onClick={() => setShowCategories(!showCategories)}
          className="flex w-full items-center justify-center gap-2 p-3 transition-all hover:bg-slate-50 dark:hover:bg-slate-700"
        >
          <p className="text-[10px] font-black uppercase text-slate-400">
            Quiz Categories{" "}
            <span className="text-indigo-400">{categoriesCount}</span>
          </p>
          <span
            className={`text-xs text-slate-300 transition-transform ${showCategories ? "rotate-180" : ""}`}
          >
            ▼
          </span>
        </button>
        {showCategories && (
          <div className="flex flex-wrap justify-center gap-2 border-t border-slate-100 p-3 dark:border-slate-700">
            {verbData.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => toggleGroup(group.id)}
                className={`rounded-xl border-2 px-3 py-1.5 text-[9px] font-black transition-all ${
                  enabledGroups.includes(group.id)
                    ? "border-indigo-400 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
                    : "border-slate-100 bg-slate-50 text-slate-300 dark:border-slate-600 dark:bg-slate-700"
                }`}
              >
                {group.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quiz Card */}
      <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl dark:border-slate-600 dark:bg-slate-800/50">
        {(["present", "past", "participle", "meaning"] as VerbField[]).map(
          (type, index) => {
            const isMeaning = type === "meaning";
            const isClue = type === quizState.clueType;
            const inputState = inputStates[type];

            return (
              <div
                key={type}
                className={`slot-row ${isClue ? "bg-indigo-50/50 dark:bg-indigo-500/10" : ""}`}
              >
                <span className="slot-label">{labels[type]}</span>
                {isClue ? (
                  <div
                    className={`flex-1 text-lg font-black text-indigo-600 dark:text-indigo-300 ${!isMeaning ? "uppercase" : ""}`}
                  >
                    {currentVerb[type]}
                  </div>
                ) : (
                  <input
                    ref={index === 0 || (index === 1 && quizState.clueType === "present") ? firstInputRef : null}
                    type="text"
                    value={inputs[type] || ""}
                    onChange={(e) => handleInputChange(type, e.target.value)}
                    readOnly={buttonsLocked}
                    className={`flex-1 border-b-2 bg-transparent p-1 text-lg font-bold outline-none ${!isMeaning ? "uppercase" : ""} ${
                      inputStateStyles[inputState ?? "default"]
                    }`}
                  />
                )}
              </div>
            );
          }
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={checkAnswer}
          disabled={buttonsLocked}
          className="min-w-0 flex-1 rounded-2xl bg-indigo-600 py-4 text-base font-black text-white shadow-lg transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:py-5 sm:text-lg"
        >
          CHECK ANSWER
        </button>
        <button
          type="button"
          onClick={giveUp}
          disabled={buttonsLocked}
          className="shrink-0 rounded-xl bg-amber-500 px-4 py-4 text-xs font-bold text-white shadow-lg transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:rounded-2xl sm:px-5 sm:py-5"
        >
          💡 SOLVE
        </button>
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          className={`py-4 text-center text-xl font-black ${feedbackStyles[feedback]}`}
        >
          {feedback === "correct" && "✓ EXCELLENT!"}
          {feedback === "incorrect" && "✗ INCORRECT"}
          {feedback === "skipped" && "💡 SKIPPED"}
        </div>
      )}

      {/* Floating Stats */}
      <div
        onClick={() => setShowHistory(true)}
        className="fixed bottom-6 left-4 right-4 z-50 mx-auto flex max-w-md cursor-pointer justify-around rounded-3xl bg-slate-800 p-4 text-white shadow-2xl dark:border dark:border-slate-500 dark:bg-slate-700"
      >
        <div className="text-center">
          <span className="block text-[10px] font-bold uppercase text-slate-400">
            Success
          </span>
          <span className="text-xl font-black text-green-400">{stats.score}</span>
        </div>
        <div className="text-center">
          <span className="block text-[10px] font-bold uppercase text-slate-400">
            Fails
          </span>
          <span className="text-xl font-black text-rose-400">{stats.fails}</span>
        </div>
        <div className="text-center">
          <span className="block text-[10px] font-bold uppercase text-slate-400">
            Total
          </span>
          <span className="text-xl font-black text-slate-200">{stats.total}</span>
        </div>
      </div>

      {/* History Modal */}
      {showHistory && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
          onClick={() => setShowHistory(false)}
        >
          <div
            className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-slate-800 sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-900">
              <h2 className="text-xl font-black italic text-slate-800 dark:text-slate-200">
                Your History
              </h2>
              <button
                type="button"
                onClick={() => setShowHistory(false)}
                className="text-2xl text-slate-400"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {stats.history.slice(0, 15).map((item, index) => (
                <div
                  key={`${item.verb.present}-${index}`}
                  className={`group relative rounded-xl border p-3 ${
                    item.status === "ok"
                      ? "border-green-100 bg-green-50 dark:border-green-800 dark:bg-green-900/30"
                      : "border-rose-100 bg-rose-50 dark:border-rose-800 dark:bg-rose-900/30"
                  }`}
                >
                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => setConfirmModal({ isOpen: true, type: "delete", itemIndex: index })}
                    className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full text-[10px] text-slate-400 opacity-100 transition-all hover:bg-rose-100 hover:text-rose-500 dark:hover:bg-rose-900/30 md:opacity-0 md:group-hover:opacity-100"
                  >
                    ✕
                  </button>
                  <div className="flex items-center justify-between pr-6">
                    <span className="font-bold uppercase text-slate-800 dark:text-slate-200">
                      {item.verb.present}
                    </span>
                    <span className="text-[8px] font-black uppercase italic text-slate-400">
                      {item.verb.meaning}
                    </span>
                  </div>
                </div>
              ))}
              {stats.history.length === 0 && (
                <p className="py-8 text-center text-sm text-slate-400">
                  No history yet
                </p>
              )}
            </div>
            <div className="border-t bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setConfirmModal({ isOpen: true, type: "reset" })}
                className="w-full rounded-xl border-2 border-rose-200 py-3 text-sm font-bold text-rose-500 transition-all hover:bg-rose-50 dark:border-rose-800 dark:hover:bg-rose-900/30"
              >
                🗑️ Reset Stats
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.type === "delete" ? "Delete Entry?" : "Reset All Stats?"}
        message={
          confirmModal.type === "delete"
            ? "This practice entry will be removed from your history."
            : "All your practice stats and history will be reset to zero. This cannot be undone."
        }
        confirmText={confirmModal.type === "delete" ? "Delete" : "Reset All"}
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmModal({ isOpen: false, type: "reset" })}
      />
    </div>
  );
});
