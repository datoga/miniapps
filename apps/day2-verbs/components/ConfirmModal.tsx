"use client";

import { ConfirmDialog } from "@miniapps/ui";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning";
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * ConfirmModal - Wrapper around shared ConfirmDialog for backwards compatibility
 */
export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <ConfirmDialog
      open={isOpen}
      title={title}
      message={message}
      confirmLabel={confirmText}
      cancelLabel={cancelText}
      variant={variant}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
