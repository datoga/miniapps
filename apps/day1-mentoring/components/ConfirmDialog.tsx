"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@miniapps/ui";
import { Modal } from "./Modal";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog = memo(function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const t = useTranslations();

  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <p className="mb-6 text-gray-600 dark:text-gray-400">{message}</p>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel}>
          {t("confirm.cancel")}
        </Button>
        <Button onClick={onConfirm}>{t("confirm.confirm")}</Button>
      </div>
    </Modal>
  );
});

