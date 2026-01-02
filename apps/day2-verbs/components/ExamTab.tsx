"use client";

import { trackEvent } from "@miniapps/analytics";
import { buildShareText, useShare } from "@miniapps/ui";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useExamHistory, type ExamResult } from "../lib/useExamHistory";
import { verbData, type Verb } from "../lib/verbData";
import { ConfirmModal } from "./ConfirmModal";

type VerbField = "present" | "past" | "participle" | "meaning";

interface ExamQuestion {
  verb: Verb;
  clueType: VerbField;
  missing: VerbField[];
  userAnswers: Record<string, string>;
  isCorrect: boolean | null;
}

interface ExamConfig {
  categories: string[];
  questionCount: number;
  timePerQuestion: number; // in seconds
}

type ExamPhase = "setup" | "exam" | "results";

const labels: Record<VerbField, string> = {
  present: "Present",
  past: "Past",
  participle: "Participle",
  meaning: "Translation",
};

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = shuffled[i];
    shuffled[i] = shuffled[j] as T;
    shuffled[j] = temp as T;
  }
  return shuffled;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export const ExamTab = memo(function ExamTab() {
  const { history, addExamResult, removeExamResult, resetExamHistory } = useExamHistory();

  // Phase state
  const [phase, setPhase] = useState<ExamPhase>("setup");

  // Setup state
  const [config, setConfig] = useState<ExamConfig>({
    categories: verbData.map((g) => g.id),
    questionCount: 10,
    timePerQuestion: 60,
  });
  const [showCategories, setShowCategories] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Exam state
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);

  // Results state
  const [lastResult, setLastResult] = useState<ExamResult | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  const [showNewBestModal, setShowNewBestModal] = useState(false);

  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: "delete" | "reset";
    examId?: string;
  }>({ isOpen: false, type: "delete" });

  const firstInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const examFinishedRef = useRef(false);
  const finishExamRef = useRef<() => void>(() => {});
  const inputsRef = useRef<Record<string, string>>({});
  const currentIndexRef = useRef(0);

  // Available verbs based on categories (deduplicated)
  const availableVerbs = useMemo(() => {
    const allVerbs = verbData
      .filter((g) => config.categories.includes(g.id))
      .flatMap((g) => g.verbs);
    // Deduplicate by present form
    return Array.from(new Map(allVerbs.map((v) => [v.present, v])).values());
  }, [config.categories]);

  // Max questions available
  const maxQuestions = availableVerbs.length;

  // Toggle category
  const toggleCategory = useCallback((id: string) => {
    setConfig((prev) => {
      const newCategories = prev.categories.includes(id)
        ? prev.categories.filter((c) => c !== id)
        : [...prev.categories, id];

      // Keep at least one category
      if (newCategories.length === 0) {
        return prev;
      }

      return { ...prev, categories: newCategories };
    });
  }, []);

  // Update question count
  const setQuestionCount = useCallback(
    (count: number) => {
      setConfig((prev) => ({ ...prev, questionCount: Math.min(count, maxQuestions) }));
    },
    [maxQuestions]
  );

  // Update time per question
  const setTimePerQuestion = useCallback((time: number) => {
    setConfig((prev) => ({ ...prev, timePerQuestion: time }));
  }, []);

  // Generate questions for exam (no duplicates - availableVerbs already deduplicated)
  const generateQuestions = useCallback((): ExamQuestion[] => {
    const shuffled = shuffleArray(availableVerbs);
    const selected = shuffled.slice(0, Math.min(config.questionCount, maxQuestions));

    return selected.map((verb) => {
      const types: VerbField[] = ["present", "past", "participle", "meaning"];
      const clueIndex = Math.floor(Math.random() * 4);
      const clueType = types[clueIndex] ?? "present";
      const missing = types.filter((_, i) => i !== clueIndex);

      return {
        verb,
        clueType,
        missing,
        userAnswers: {},
        isCorrect: null,
      };
    });
  }, [availableVerbs, config.questionCount, maxQuestions]);

  // Start exam
  const startExam = useCallback(() => {
    examFinishedRef.current = false;
    const newQuestions = generateQuestions();
    setQuestions(newQuestions);
    setCurrentIndex(0);
    setInputs({});
    setTimeLeft(config.timePerQuestion * newQuestions.length);
    setPhase("exam");

    // Track exam start
    trackEvent("exam_start", {
      question_count: newQuestions.length,
      time_limit: config.timePerQuestion * newQuestions.length,
    });

    setTimeout(() => firstInputRef.current?.focus(), 100);
  }, [generateQuestions, config.timePerQuestion]);

  // Timer effect
  useEffect(() => {
    if (phase !== "exam") {
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [phase]);

  // Check single question answer
  const checkAnswer = useCallback(
    (question: ExamQuestion, userInputs: Record<string, string>): boolean => {
      return question.missing.every((type) => {
        const val = (userInputs[type] || "").trim().toLowerCase();
        const original = question.verb[type].toLowerCase();
        const correctForms = [...original.split("/"), original];
        return correctForms.includes(val);
      });
    },
    []
  );

  // Save current answers without grading
  const saveCurrentAnswers = useCallback(() => {
    setQuestions((prev) => {
      const updated = [...prev];
      const currentQuestion = updated[currentIndex];
      if (currentQuestion) {
        updated[currentIndex] = {
          ...currentQuestion,
          userAnswers: { ...inputs },
        };
      }
      return updated;
    });
  }, [currentIndex, inputs]);

  // Navigate to previous question
  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      saveCurrentAnswers();
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      // Load previous answers
      const prevQuestion = questions[prevIndex];
      setInputs(prevQuestion?.userAnswers || {});
      setTimeout(() => firstInputRef.current?.focus(), 50);
    }
  }, [currentIndex, saveCurrentAnswers, questions]);

  // Navigate to next question
  const goToNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      saveCurrentAnswers();
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      // Load next answers if any
      const nextQuestion = questions[nextIndex];
      setInputs(nextQuestion?.userAnswers || {});
      setTimeout(() => firstInputRef.current?.focus(), 50);
    }
  }, [currentIndex, questions, saveCurrentAnswers]);

  // Grade all answers and finish exam
  const gradeExam = useCallback(() => {
    // Save current answers first
    saveCurrentAnswers();
    // Wait for state update then finish
    setTimeout(() => finishExamRef.current(), 100);
  }, [saveCurrentAnswers]);

  // Finish exam
  const finishExam = useCallback(() => {
    // Prevent double execution
    if (examFinishedRef.current) {
      return;
    }
    examFinishedRef.current = true;

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // First, save current inputs to the current question
    const currentInputs = inputsRef.current;
    const idx = currentIndexRef.current;

    // Grade all questions, including current unsaved answers
    const updatedQuestions = questions.map((q, qIndex) => {
      const answers = qIndex === idx ? { ...q.userAnswers, ...currentInputs } : q.userAnswers;
      const isCorrect = checkAnswer(q, answers);
      return { ...q, userAnswers: answers, isCorrect };
    });

    setQuestions(updatedQuestions);

    // Calculate results
    const correct = updatedQuestions.filter((q) => q.isCorrect).length;
    const incorrect = updatedQuestions.filter((q) => !q.isCorrect).length;
    const totalTime = config.timePerQuestion * updatedQuestions.length;
    const timeUsed = Math.max(0, totalTime - timeLeft);

    // Check if this is a new best score
    const newPercentage = (correct / updatedQuestions.length) * 100;
    const previousBestPercentage =
      history.length > 0 ? Math.max(...history.map((e) => (e.correct / e.total) * 100)) : 0;
    const isNewBest = newPercentage > previousBestPercentage && newPercentage > 0;

    const result = addExamResult({
      correct,
      incorrect,
      total: updatedQuestions.length,
      timeUsed,
      timeLimit: totalTime,
      categories: config.categories,
    });

    setLastResult(result);
    setPhase("results");

    // Track exam finish
    trackEvent("exam_finish", {
      correct,
      total: updatedQuestions.length,
      percentage: Math.round((correct / updatedQuestions.length) * 100),
      time_used: timeUsed,
      is_new_best: isNewBest,
    });

    // Show congratulation modal if new best
    if (isNewBest) {
      setTimeout(() => setShowNewBestModal(true), 500);
    }
  }, [questions, config, timeLeft, addExamResult, history, checkAnswer]);

  // Keep ref updated with latest finishExam
  useEffect(() => {
    finishExamRef.current = finishExam;
  }, [finishExam]);

  // Handle time running out
  useEffect(() => {
    if (phase === "exam" && timeLeft === 0) {
      finishExamRef.current();
    }
  }, [phase, timeLeft]);

  // Handle input change
  const handleInputChange = useCallback((field: VerbField, value: string) => {
    setInputs((prev) => {
      const newInputs = { ...prev, [field]: value };
      inputsRef.current = newInputs;
      return newInputs;
    });
  }, []);

  // Keep refs in sync
  useEffect(() => {
    inputsRef.current = inputs;
  }, [inputs]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  // Reset to setup
  const resetToSetup = useCallback(() => {
    examFinishedRef.current = false;
    setPhase("setup");
    setQuestions([]);
    setCurrentIndex(0);
    setInputs({});
    setLastResult(null);
    setExpandedQuestion(null);
  }, []);

  // Share results using reusable hook
  const shareText = useMemo(() => {
    if (!lastResult) {
      return "";
    }
    const percentage = Math.round((lastResult.correct / lastResult.total) * 100);
    return buildShareText([
      "Resultados de Irregular Verbs en VerbMasterPro 🇬🇧",
      "",
      `✅ ${lastResult.correct}/${lastResult.total} (${percentage}%)`,
      `⏱️ ${formatTime(lastResult.timeUsed)}`,
      "",
      "Practica gratis:",
    ]);
  }, [lastResult]);

  const { share: shareResults } = useShare({
    text: shareText,
    url: typeof window !== "undefined" ? window.location.origin : "",
    clipboardMessage: "¡Resultados copiados al portapapeles!",
    onSuccess: (method) => {
      trackEvent("exam_share", {
        method,
        percentage: lastResult ? Math.round((lastResult.correct / lastResult.total) * 100) : 0,
      });
    },
  });

  // Categories count display
  const categoriesCount =
    config.categories.length === verbData.length ? "(all)" : `(${config.categories.length})`;

  // SETUP PHASE
  if (phase === "setup") {
    return (
      <div className="space-y-4">
        {/* Categories Filter */}
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setShowCategories(!showCategories)}
            className="flex w-full items-center justify-center gap-2 p-3 transition-all hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            <p className="text-[10px] font-black uppercase text-slate-400">
              Categories <span className="text-indigo-400">{categoriesCount}</span>
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
                  onClick={() => toggleCategory(group.id)}
                  className={`rounded-xl border-2 px-3 py-1.5 text-[9px] font-black transition-all ${
                    config.categories.includes(group.id)
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

        {/* Question Count */}
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <label className="mb-3 block text-center text-[10px] font-black uppercase text-slate-400">
            Number of Questions
          </label>
          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setQuestionCount(Math.max(5, config.questionCount - 5))}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-xl font-bold text-slate-600 transition-all hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
            >
              −
            </button>
            <span className="w-16 text-center text-3xl font-black text-indigo-600 dark:text-indigo-400">
              {config.questionCount}
            </span>
            <button
              type="button"
              onClick={() => setQuestionCount(Math.min(maxQuestions, config.questionCount + 5))}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-xl font-bold text-slate-600 transition-all hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
            >
              +
            </button>
          </div>
          <p className="mt-2 text-center text-[9px] text-slate-400">
            Max: {maxQuestions} verbs available
          </p>
        </div>

        {/* Time Per Question */}
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <label className="mb-3 block text-center text-[10px] font-black uppercase text-slate-400">
            Time per Question (seconds)
          </label>
          <div className="flex flex-wrap justify-center gap-2">
            {[30, 45, 60, 90, 120].map((time) => (
              <button
                key={time}
                type="button"
                onClick={() => setTimePerQuestion(time)}
                className={`rounded-xl border-2 px-4 py-2 text-sm font-bold transition-all ${
                  config.timePerQuestion === time
                    ? "border-indigo-400 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
                    : "border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300"
                }`}
              >
                {time}s
              </button>
            ))}
          </div>
          <p className="mt-3 text-center text-xs text-slate-400">
            Total time:{" "}
            <span className="font-bold text-indigo-500">
              {formatTime(config.timePerQuestion * config.questionCount)}
            </span>
          </p>
        </div>

        {/* Start Button */}
        <button
          type="button"
          onClick={startExam}
          className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 py-5 text-lg font-black text-white shadow-lg transition-all active:scale-95"
        >
          🚀 START EXAM
        </button>

        {/* History Button */}
        {history.length > 0 && (
          <button
            type="button"
            onClick={() => setShowHistory(true)}
            className="w-full rounded-2xl border-2 border-slate-200 py-3 text-sm font-bold text-slate-500 transition-all hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700"
          >
            📊 View History ({history.length} exams)
          </button>
        )}

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
                  Exam History
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
                {(() => {
                  // Find best score (highest percentage)
                  const bestPercentage = Math.max(
                    ...history.map((e) => (e.correct / e.total) * 100)
                  );
                  return history.map((exam) => {
                    const percentage = (exam.correct / exam.total) * 100;
                    const isBest = percentage === bestPercentage && percentage > 0;
                    return (
                      <div
                        key={exam.id}
                        className={`group relative rounded-xl border-2 p-4 ${
                          isBest
                            ? "border-amber-400 bg-amber-50 dark:border-amber-500 dark:bg-amber-900/20"
                            : "border-slate-100 bg-slate-50 dark:border-slate-700 dark:bg-slate-700/50"
                        }`}
                      >
                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmModal({ isOpen: true, type: "delete", examId: exam.id })
                          }
                          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-xs text-slate-400 opacity-100 transition-all hover:bg-rose-100 hover:text-rose-500 dark:hover:bg-rose-900/30 md:opacity-0 md:group-hover:opacity-100"
                        >
                          ✕
                        </button>
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-lg font-black ${
                              isBest
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-indigo-600 dark:text-indigo-400"
                            }`}
                          >
                            {isBest && "🏆 "}
                            {exam.correct}/{exam.total}
                          </span>
                          <span className="text-xs text-slate-400">
                            {new Date(exam.date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                          <span>{Math.round(percentage)}% correct</span>
                          <span>⏱️ {formatTime(exam.timeUsed)}</span>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
              {/* Reset All Button */}
              <div className="border-t bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => setConfirmModal({ isOpen: true, type: "reset" })}
                  className="w-full rounded-xl border-2 border-rose-200 py-3 text-sm font-bold text-rose-500 transition-all hover:bg-rose-50 dark:border-rose-800 dark:hover:bg-rose-900/30"
                >
                  🗑️ Reset History
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Modal */}
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.type === "delete" ? "Delete Exam?" : "Reset All History?"}
          message={
            confirmModal.type === "delete"
              ? "This exam result will be permanently removed from your history."
              : "All your exam history will be permanently deleted. This action cannot be undone."
          }
          confirmText={confirmModal.type === "delete" ? "Delete" : "Reset All"}
          cancelText="Cancel"
          variant="danger"
          onConfirm={() => {
            if (confirmModal.type === "delete" && confirmModal.examId) {
              removeExamResult(confirmModal.examId);
            } else if (confirmModal.type === "reset") {
              resetExamHistory();
            }
            setConfirmModal({ isOpen: false, type: "delete" });
          }}
          onCancel={() => setConfirmModal({ isOpen: false, type: "delete" })}
        />
      </div>
    );
  }

  // EXAM PHASE
  if (phase === "exam") {
    const currentQuestion = questions[currentIndex];
    const progress = (currentIndex / questions.length) * 100;
    const timeProgress = (timeLeft / (config.timePerQuestion * questions.length)) * 100;

    if (!currentQuestion) {
      return <div className="py-8 text-center text-slate-400">Loading...</div>;
    }

    return (
      <div className="space-y-4">
        {/* Progress & Timer Bar */}
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between p-3">
            <div className="text-center">
              <span className="block text-[9px] font-bold uppercase text-slate-400">Question</span>
              <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                {currentIndex + 1}/{questions.length}
              </span>
            </div>
            <div className="text-center">
              <span className="block text-[9px] font-bold uppercase text-slate-400">Time Left</span>
              <span
                className={`text-lg font-black ${timeLeft <= 30 ? "text-rose-500 animate-pulse" : "text-amber-500"}`}
              >
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>
          {/* Progress bars */}
          <div className="h-1 bg-slate-100 dark:bg-slate-700">
            <div
              className="h-full bg-indigo-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="h-1 bg-slate-100 dark:bg-slate-700">
            <div
              className={`h-full transition-all ${timeLeft <= 30 ? "bg-rose-500" : "bg-amber-500"}`}
              style={{ width: `${timeProgress}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl dark:border-slate-600 dark:bg-slate-800/50">
          {(["present", "past", "participle", "meaning"] as VerbField[]).map((type, index) => {
            const isMeaning = type === "meaning";
            const isClue = type === currentQuestion.clueType;

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
                    {currentQuestion.verb[type]}
                  </div>
                ) : (
                  <input
                    ref={
                      index === 0 || (index === 1 && currentQuestion.clueType === "present")
                        ? firstInputRef
                        : null
                    }
                    type="text"
                    value={inputs[type] || ""}
                    onChange={(e) => handleInputChange(type, e.target.value)}
                    className={`flex-1 border-b-2 border-slate-200 bg-transparent p-1 text-lg font-bold outline-none focus:border-indigo-400 dark:border-slate-500 dark:text-white dark:focus:border-indigo-400 ${!isMeaning ? "uppercase" : ""}`}
                    autoComplete="off"
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Question Dots Navigation */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          {questions.map((q, idx) => {
            const hasAnswer = Object.values(q.userAnswers).some((v) => v.trim() !== "");
            const isCurrent = idx === currentIndex;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  saveCurrentAnswers();
                  setCurrentIndex(idx);
                  const targetQuestion = questions[idx];
                  setInputs(targetQuestion?.userAnswers || {});
                  setTimeout(() => firstInputRef.current?.focus(), 50);
                }}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  isCurrent
                    ? "bg-indigo-600 text-white shadow-md"
                    : hasAnswer
                      ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400"
                      : "bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500"
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={goToPrevious}
            disabled={currentIndex === 0}
            className="flex-1 rounded-2xl border-2 border-slate-200 py-4 text-base font-bold text-slate-600 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700"
          >
            ← Previous
          </button>
          <button
            type="button"
            onClick={goToNext}
            disabled={currentIndex === questions.length - 1}
            className="flex-1 rounded-2xl bg-indigo-600 py-4 text-base font-bold text-white shadow-lg transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next →
          </button>
        </div>

        {/* Grade Exam Button */}
        <button
          type="button"
          onClick={gradeExam}
          className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 py-5 text-lg font-black text-white shadow-lg transition-all active:scale-95"
        >
          ✅ GRADE EXAM
        </button>
      </div>
    );
  }

  // RESULTS PHASE
  if (phase === "results" && lastResult) {
    const percentage = Math.round((lastResult.correct / lastResult.total) * 100);

    return (
      <div className="space-y-4">
        {/* Results Summary */}
        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-gradient-to-br from-indigo-500 to-purple-600 p-6 text-white shadow-xl">
          <h2 className="mb-4 text-center text-2xl font-black">🎓 Exam Complete!</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <span className="block text-[10px] font-bold uppercase opacity-80">Correct</span>
              <span className="text-3xl font-black">{lastResult.correct}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase opacity-80">Wrong</span>
              <span className="text-3xl font-black">{lastResult.incorrect}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase opacity-80">Total</span>
              <span className="text-3xl font-black">{lastResult.total}</span>
            </div>
          </div>
          <div className="mt-4 text-center">
            <span className="text-5xl font-black">{percentage}%</span>
            <p className="mt-1 text-sm opacity-80">
              ⏱️ Time used: {formatTime(lastResult.timeUsed)}
            </p>
          </div>
        </div>

        {/* Share Button - only on mobile/tablet */}
        <button
          type="button"
          onClick={shareResults}
          className="w-full rounded-2xl bg-indigo-600 py-4 text-sm font-bold text-white shadow-lg transition-all active:scale-95 lg:hidden"
        >
          📤 Share Results
        </button>

        {/* Detailed Results */}
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="border-b border-slate-100 p-3 dark:border-slate-700">
            <p className="text-center text-[10px] font-black uppercase text-slate-400">
              Detailed Results (tap to see answer)
            </p>
          </div>
          <div className="max-h-[40vh] space-y-2 overflow-y-auto p-3">
            {questions.map((q, index) => (
              <div
                key={`${q.verb.present}-${index}`}
                className={`cursor-pointer rounded-xl border-2 p-3 transition-all ${
                  q.isCorrect
                    ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/30"
                    : "border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-900/30"
                }`}
                onClick={() => setExpandedQuestion(expandedQuestion === index ? null : index)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {index + 1}. {q.verb.present}
                  </span>
                  <span className="text-lg">{q.isCorrect ? "✅" : "❌"}</span>
                </div>

                {expandedQuestion === index && (
                  <div className="mt-3 space-y-1 border-t border-slate-200 pt-3 dark:border-slate-600">
                    {(["present", "past", "participle", "meaning"] as VerbField[]).map((type) => {
                      const isClue = type === q.clueType;
                      const userAnswer = q.userAnswers[type] || "";
                      const correctAnswer = q.verb[type];
                      const isAnswerCorrect =
                        userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase() ||
                        correctAnswer
                          .toLowerCase()
                          .split("/")
                          .includes(userAnswer.toLowerCase().trim());

                      return (
                        <div key={type} className="flex items-center gap-2 text-sm">
                          <span className="w-20 text-[10px] font-bold uppercase text-slate-400">
                            {labels[type]}:
                          </span>
                          {isClue ? (
                            <span className="font-bold text-indigo-600 dark:text-indigo-400">
                              {correctAnswer} (clue)
                            </span>
                          ) : (
                            <div className="flex-1">
                              {userAnswer ? (
                                <span
                                  className={
                                    isAnswerCorrect
                                      ? "text-green-600 dark:text-green-400"
                                      : "text-rose-500"
                                  }
                                >
                                  {userAnswer}
                                </span>
                              ) : (
                                <span className="text-slate-300 dark:text-slate-500">—</span>
                              )}
                              {!isAnswerCorrect && (
                                <span className="ml-2 font-bold text-green-600 dark:text-green-400">
                                  → {correctAnswer}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* New Exam Button */}
        <button
          type="button"
          onClick={resetToSetup}
          className="w-full rounded-2xl border-2 border-indigo-200 py-4 text-lg font-bold text-indigo-600 transition-all hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
        >
          🔄 New Exam
        </button>

        {/* New Best Score Modal */}
        {showNewBestModal && (
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onClick={() => setShowNewBestModal(false)}
          >
            <div
              className="w-full max-w-sm animate-bounce-in overflow-hidden rounded-3xl bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-400 p-1 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="rounded-[1.35rem] bg-white p-6 text-center dark:bg-slate-800">
                <div className="mb-4 text-6xl">🏆</div>
                <h2 className="mb-2 text-2xl font-black text-amber-600 dark:text-amber-400">
                  NEW BEST SCORE!
                </h2>
                <p className="mb-4 text-4xl font-black text-slate-800 dark:text-white">
                  {percentage}%
                </p>
                <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
                  Congratulations! You beat your previous record!
                </p>
                <button
                  type="button"
                  onClick={() => setShowNewBestModal(false)}
                  className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 font-bold text-white shadow-lg transition-all active:scale-95"
                >
                  🎉 Awesome!
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
});
