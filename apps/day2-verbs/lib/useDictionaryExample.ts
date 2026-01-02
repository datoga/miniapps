"use client";

import { useState, useCallback } from "react";

interface DictionaryDefinition {
  definition: string;
  example?: string;
}

interface DictionaryMeaning {
  partOfSpeech: string;
  definitions: DictionaryDefinition[];
}

interface DictionaryEntry {
  word: string;
  phonetic?: string;
  meanings: DictionaryMeaning[];
}

export interface ExampleResult {
  word: string;
  example: string;
  definition: string;
}

export function useDictionaryExample() {
  const [result, setResult] = useState<ExampleResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExample = useCallback(async (word: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    const normalizedWord = word.toLowerCase().trim();

    try {
      const res = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(normalizedWord)}`
      );

      if (!res.ok) {
        throw new Error("Word not found");
      }

      const data: DictionaryEntry[] = await res.json();
      const entry = data[0];

      if (!entry) {
        throw new Error("No data found");
      }

      // Collect examples ONLY from verb meanings
      const verbExamples: ExampleResult[] = [];

      for (const meaning of entry.meanings) {
        // Only include verb examples (this is a verb learning app!)
        if (meaning.partOfSpeech !== "verb") {
          continue;
        }

        for (const def of meaning.definitions) {
          if (def.example) {
            verbExamples.push({
              word: entry.word,
              example: def.example,
              definition: def.definition,
            });
          }
        }
      }

      // If no verb examples found, try to get verb definition without example
      if (verbExamples.length === 0) {
        const verbMeaning = entry.meanings.find((m) => m.partOfSpeech === "verb");
        const firstVerbDef = verbMeaning?.definitions[0];

        if (firstVerbDef) {
          setResult({
            word: entry.word,
            example: `No verb example available for "${word}"`,
            definition: firstVerbDef.definition,
          });
        } else {
          setResult({
            word: entry.word,
            example: `No verb usage found for "${word}"`,
            definition: "This word may not be commonly used as a verb.",
          });
        }
      } else {
        // Pick a random example from all available
        const randomIndex = Math.floor(Math.random() * verbExamples.length);
        setResult(verbExamples[randomIndex] ?? null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch example");
    }

    setLoading(false);
  }, []);

  const clear = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, loading, error, fetchExample, clear };
}
