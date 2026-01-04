"use client";

import {
  ConfirmDialog as BaseConfirmDialog,
  type ConfirmDialogProps as BaseConfirmDialogProps,
} from "@miniapps/ui";
import { useTranslations } from "next-intl";

// Re-export with default labels from i18n
export interface ConfirmDialogProps
  extends Omit<BaseConfirmDialogProps, "confirmLabel" | "cancelLabel" | "closeLabel"> {
  confirmLabel?: string;
  cancelLabel?: string;
}

export function ConfirmDialog({ confirmLabel, cancelLabel, ...props }: ConfirmDialogProps) {
  const t = useTranslations();

  return (
    <BaseConfirmDialog
      {...props}
      confirmLabel={confirmLabel || t("confirm.confirm")}
      cancelLabel={cancelLabel || t("common.cancel")}
      closeLabel={t("common.close")}
    />
  );
}
