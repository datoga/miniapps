"use client";

import { memo, useCallback, useEffect, type ReactNode } from "react";
import { cn } from "./utils";

export interface ModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when the modal should close */
  onClose: () => void;
  /** Modal title - can be a string or ReactNode */
  title: ReactNode;
  /** Modal content */
  children: ReactNode;
  /** Size preset or custom max-width class */
  size?: "sm" | "md" | "lg" | "xl" | "full" | string;
  /** Whether to show the close button */
  showCloseButton?: boolean;
  /** Additional class name for the modal container */
  className?: string;
  /** aria-label for close button (for i18n) */
  closeLabel?: string;
}

const sizeClasses: Record<string, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-4xl",
};

/**
 * Modal component - A flexible, accessible modal dialog
 *
 * @example
 * ```tsx
 * <Modal open={isOpen} onClose={() => setIsOpen(false)} title="My Modal">
 *   <p>Modal content here</p>
 * </Modal>
 * ```
 */
export const Modal = memo(function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
  showCloseButton = true,
  className,
  closeLabel = "Close",
}: ModalProps) {
  // Close on escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  // Handle body scroll lock and escape key listener
  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown]);

  if (!open) {
    return null;
  }

  // Get size class - either from preset or use as custom class
  const sizeClass = sizeClasses[size] || size;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal content */}
      <div
        className={cn(
          "relative max-h-[85vh] sm:max-h-[90vh] w-full overflow-y-auto overscroll-contain rounded-t-xl sm:rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800 transition-all",
          sizeClass,
          className
        )}
        style={{ WebkitOverflowScrolling: "touch" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between gap-4">
          <div
            id="modal-title"
            className="flex-1 min-w-0 text-xl font-semibold text-gray-900 dark:text-white"
          >
            {title}
          </div>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors"
              aria-label={closeLabel}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  );
});


