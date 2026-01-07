"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface UseControlsVisibilityOptions {
  /** Duration in ms before auto-hiding controls */
  hideDelay?: number;
}

interface UseControlsVisibilityResult {
  /** Whether controls are currently visible */
  showControls: boolean;
  /** Show controls temporarily (auto-hides after delay) */
  showControlsTemporarily: () => void;
  /** Hide controls immediately */
  hideControlsNow: () => void;
  /** Handle click - shows/extends controls visibility */
  handleClick: () => void;
  /** Mouse enter handler */
  onMouseEnter: () => void;
  /** Mouse move handler */
  onMouseMove: () => void;
  /** Mouse leave handler */
  onMouseLeave: () => void;
}

/**
 * Hook for managing controls visibility with auto-hide behavior.
 * Used for overlay controls that should appear on hover/click and auto-hide.
 */
export function useControlsVisibility(
  options: UseControlsVisibilityOptions = {}
): UseControlsVisibilityResult {
  const { hideDelay = 3000 } = options;

  const [showControls, setShowControls] = useState(true);
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }
    hideControlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, hideDelay);
  }, [hideDelay]);

  const hideControlsNow = useCallback(() => {
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
      hideControlsTimeoutRef.current = null;
    }
    setShowControls(false);
  }, []);

  // Handle click - always show/extend controls visibility
  // On mobile, users need to tap to show controls, then tap buttons
  // So we should NOT toggle (hide on second tap) - just extend visibility
  const handleClick = useCallback(() => {
    showControlsTemporarily();
  }, [showControlsTemporarily]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
    };
  }, []);

  return {
    showControls,
    showControlsTemporarily,
    hideControlsNow,
    handleClick,
    onMouseEnter: showControlsTemporarily,
    onMouseMove: showControlsTemporarily,
    onMouseLeave: hideControlsNow,
  };
}


