"use client";

import { memo, useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@miniapps/ui";
import { Modal } from "./Modal";
import { ConfirmDialog } from "./ConfirmDialog";
import type { Mentee, Session, Backup } from "../lib/schemas";
import { BackupSchema } from "../lib/schemas";

interface BackupPanelProps {
  open: boolean;
  mentees: Mentee[];
  sessions: Session[];
  onImport: (mentees: Mentee[], sessions: Session[]) => Promise<void>;
  onClose: () => void;
}

export const BackupPanel = memo(function BackupPanel({
  open,
  mentees,
  sessions,
  onImport,
  onClose,
}: BackupPanelProps) {
  const t = useTranslations();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [importError, setImportError] = useState<string | null>(null);
  const [confirmImport, setConfirmImport] = useState(false);
  const [pendingBackup, setPendingBackup] = useState<Backup | null>(null);

  const handleExport = useCallback(() => {
    const backup: Backup = {
      schemaVersion: 1,
      appId: "day1-mentoring",
      exportedAt: new Date().toISOString(),
      data: {
        settings: {},
        mentees,
        sessions,
      },
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mentorflow-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [mentees, sessions]);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) {
        return;
      }

      try {
        const text = await file.text();
        const json = JSON.parse(text);

        // Validate with Zod
        const result = BackupSchema.safeParse(json);
        if (!result.success) {
          setImportError(t("backup.importError"));
          return;
        }

        // Show confirmation
        setImportError(null);
        setPendingBackup(result.data);
        setConfirmImport(true);
      } catch {
        setImportError(t("backup.importError"));
      }

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [t]
  );

  const handleConfirmImport = useCallback(async () => {
    if (pendingBackup) {
      await onImport(pendingBackup.data.mentees, pendingBackup.data.sessions);
      setPendingBackup(null);
      setConfirmImport(false);
      onClose();
    }
  }, [pendingBackup, onImport, onClose]);

  const handleCancelImport = useCallback(() => {
    setPendingBackup(null);
    setConfirmImport(false);
  }, []);

  return (
    <>
      <Modal open={open} onClose={onClose} title={t("backup.title")}>
        <div className="space-y-6">
          {/* Export section */}
          <div>
            <h3 className="mb-2 font-medium text-gray-900 dark:text-white">
              {t("backup.export")}
            </h3>
            <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
              {t("backup.exportDescription")}
            </p>
            <Button onClick={handleExport}>{t("backup.export")}</Button>
          </div>

          <hr className="border-gray-200 dark:border-gray-700" />

          {/* Import section */}
          <div>
            <h3 className="mb-2 font-medium text-gray-900 dark:text-white">
              {t("backup.import")}
            </h3>
            <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
              {t("backup.importDescription")}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              {t("backup.selectFile")}
            </Button>
            {importError && (
              <p className="mt-2 text-sm text-red-500">{importError}</p>
            )}
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmImport}
        title={t("backup.importConfirmTitle")}
        message={t("backup.importConfirmMessage")}
        onConfirm={handleConfirmImport}
        onCancel={handleCancelImport}
      />
    </>
  );
});

