"use client";

import { useCallback } from "react";

export function useSpeech() {
  const speak = useCallback((text: string) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-GB";
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  return { speak };
}

