"use client";

import { useRef, useCallback } from "react";

interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

interface UseSwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
}

export function useSwipe({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
}: UseSwipeOptions): SwipeHandlers {
  const touchStartX = useRef<number | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current === null) return;

      const touchEndX = e.changedTouches[0]?.clientX ?? 0;
      const diff = touchStartX.current - touchEndX;

      if (Math.abs(diff) > threshold) {
        if (diff > 0) {
          // Swipe left -> next
          onSwipeLeft?.();
        } else {
          // Swipe right -> previous
          onSwipeRight?.();
        }
      }

      touchStartX.current = null;
    },
    [onSwipeLeft, onSwipeRight, threshold]
  );

  return { onTouchStart, onTouchEnd };
}

