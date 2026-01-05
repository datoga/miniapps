"use client";

import {
  ConfirmDialog as BaseConfirmDialog,
  type ConfirmDialogProps as BaseConfirmDialogProps,
} from "@miniapps/ui";
import { useTranslations } from "next-intl";

// Re-export with default labels from i18n and support for isOpen/onClose aliases
export interface ConfirmDialogProps
  extends Omit<BaseConfirmDialogProps, "confirmLabel" | "cancelLabel" | "closeLabel" | "open" | "onCancel" | "loading"> {
  /** Whether the dialog is open (alias for 'open') */
  isOpen?: boolean;
  /** Whether the dialog is open */
  open?: boolean;
  /** Callback when cancelled (alias for 'onCancel') */
  onClose?: () => void;
  /** Callback when cancelled */
  onCancel?: () => void;
  /** Confirm button text (alias for confirmLabel) */
  confirmText?: string;
  /** Cancel button text (alias for cancelLabel) */
  cancelText?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Whether loading (alias for loading) */
  isLoading?: boolean;
  loading?: boolean;
  /** Additional content */
  children?: React.ReactNode;
}

export function ConfirmDialog({
  isOpen,
  open,
  onClose,
  onCancel,
  confirmLabel,
  cancelLabel,
  confirmText,
  cancelText,
  isLoading,
  loading,
  children,
  ...props
}: ConfirmDialogProps) {
  const t = useTranslations();

  return (
    <BaseConfirmDialog
      {...props}
      open={isOpen ?? open ?? false}
      onCancel={onClose ?? onCancel ?? (() => {})}
      confirmLabel={confirmText || confirmLabel || t("common.confirm")}
      cancelLabel={cancelText || cancelLabel || t("common.cancel")}
      closeLabel={t("common.close")}
      loading={isLoading ?? loading ?? false}
    >
      {children}
    </BaseConfirmDialog>
  );
}

