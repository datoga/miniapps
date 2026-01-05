"use client";

import {
  ConfirmDialog as BaseConfirmDialog,
  type ConfirmDialogProps as BaseConfirmDialogProps,
} from "@miniapps/ui";
import { useTranslations } from "next-intl";

// Re-export with default labels from i18n and support for isOpen/onClose aliases
export interface ConfirmDialogProps
  extends Omit<BaseConfirmDialogProps, "confirmLabel" | "cancelLabel" | "closeLabel" | "open" | "onCancel"> {
  /** Whether the dialog is open (alias for 'open') */
  isOpen?: boolean;
  /** Whether the dialog is open */
  open?: boolean;
  /** Callback when cancelled (alias for 'onCancel') */
  onClose?: () => void;
  /** Callback when cancelled */
  onCancel?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
}

export function ConfirmDialog({
  isOpen,
  open,
  onClose,
  onCancel,
  confirmLabel,
  cancelLabel,
  ...props
}: ConfirmDialogProps) {
  const t = useTranslations();

  return (
    <BaseConfirmDialog
      {...props}
      open={isOpen ?? open ?? false}
      onCancel={onClose ?? onCancel ?? (() => {})}
      confirmLabel={confirmLabel || t("common.confirm")}
      cancelLabel={cancelLabel || t("common.cancel")}
      closeLabel={t("common.close")}
    />
  );
}

