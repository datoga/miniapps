"use client";

import { memo, useCallback, useState } from "react";
import { useSpeech } from "../lib/useSpeech";
import { useDictionaryExample } from "../lib/useDictionaryExample";
import { ExampleModal } from "./ExampleModal";
import type { Verb } from "../lib/verbData";

interface VerbCardProps {
  verb: Verb;
}

export const VerbCard = memo(function VerbCard({ verb }: VerbCardProps) {
  const { speak } = useSpeech();
  const { result, loading, error, fetchExample, clear } = useDictionaryExample();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedWord, setSelectedWord] = useState("");

  const handlePlay = useCallback(
    (word: string) => {
      speak(word);
    },
    [speak]
  );

  const handleExample = useCallback(
    (word: string) => {
      setSelectedWord(word);
      setModalOpen(true);
      fetchExample(word);
    },
    [fetchExample]
  );

  const handleRefresh = useCallback(() => {
    if (selectedWord) {
      fetchExample(selectedWord);
    }
  }, [selectedWord, fetchExample]);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    clear();
  }, [clear]);

  return (
    <>
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[9px] font-black uppercase text-indigo-400">
            {verb.meaning}
          </span>
          {/* Example button for the verb (uses present form) */}
          <button
            type="button"
            onClick={() => handleExample(verb.present)}
            className="flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-600 transition-all hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/40"
            title="Get example sentence"
          >
            💡 Example
          </button>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => handlePlay(verb.present)}
            className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-slate-50 px-3 py-2 text-sm font-bold uppercase text-slate-700 transition-all hover:bg-indigo-50 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-indigo-900/30"
          >
            <span>🔊</span> {verb.present}
          </button>
          <button
            type="button"
            onClick={() => handlePlay(verb.past)}
            className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-slate-50 px-3 py-2 text-sm font-bold uppercase text-slate-700 transition-all hover:bg-indigo-50 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-indigo-900/30"
          >
            <span>🔊</span> {verb.past}
          </button>
          <button
            type="button"
            onClick={() => handlePlay(verb.participle)}
            className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-slate-50 px-3 py-2 text-sm font-bold uppercase text-slate-700 transition-all hover:bg-indigo-50 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-indigo-900/30"
          >
            <span>🔊</span> {verb.participle}
          </button>
        </div>
      </div>

      {/* Example Modal */}
      <ExampleModal
        open={modalOpen}
        onClose={handleCloseModal}
        word={selectedWord}
        loading={loading}
        error={error}
        result={result}
        onRefresh={handleRefresh}
      />
    </>
  );
});
