"use client";

import { memo } from "react";
import { Button } from "./Button";
import { Modal } from "./Modal";
import { cn } from "./utils";

export interface ConfirmDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Dialog title */
  title: string;
  /** Dialog message/description */
  message: string;
  /** Callback when confirmed */
  onConfirm: () => void;
  /** Callback when cancelled (also used to close) */
  onCancel: () => void;
  /** Custom confirm button label */
  confirmLabel?: string;
  /** Custom cancel button label */
  cancelLabel?: string;
  /** Visual variant - affects confirm button color */
  variant?: "default" | "danger" | "warning";
  /** Whether the confirm action is loading */
  loading?: boolean;
  /** aria-label for close button */
  closeLabel?: string;
  /** Additional content to render between message and buttons */
  children?: React.ReactNode;
}

const variantStyles = {
  default: "",
  danger: "bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-400",
  warning: "bg-amber-500 hover:bg-amber-600 dark:bg-amber-400 dark:hover:bg-amber-300",
};

/**
 * ConfirmDialog - A confirmation dialog built on Modal
 *
 * @example
 * ```tsx
 * <ConfirmDialog
 *   open={showConfirm}
 *   title="Delete item?"
 *   message="This action cannot be undone."
 *   onConfirm={handleDelete}
 *   onCancel={() => setShowConfirm(false)}
 *   variant="danger"
 *   confirmLabel="Delete"
 *   cancelLabel="Cancel"
 * />
 * ```
 */
export const ConfirmDialog = memo(function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  loading = false,
  closeLabel,
  children,
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      closeLabel={closeLabel}
    >
      <p className="text-gray-600 dark:text-gray-400">{message}</p>

      {children}

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={loading}
          className={cn(variantStyles[variant])}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              {confirmLabel}
            </span>
          ) : (
            confirmLabel
          )}
        </Button>
      </div>
    </Modal>
  );
});


