"use client";

import { ConfirmDialog, Footer } from "@miniapps/ui";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { clearAllData, exportData, importData } from "@/lib/db";
import { trackSettingsChanged } from "@/lib/ga";
import { AppHeader } from "./AppHeader";
import { AuthGate } from "./AuthGate";

interface SettingsPageProps {
  locale: string;
}

function SettingsPageContent({ locale }: SettingsPageProps) {
  const t = useTranslations();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showDeleteDataConfirm, setShowDeleteDataConfirm] = useState(false);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<unknown>(null);

  const handleExport = () => {
    const data = exportData();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `gamemaster-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    trackSettingsChanged("export_data");
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportSuccess(false);

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Store data and show confirmation
      setPendingImportData(data);
      setShowImportConfirm(true);
    } catch {
      setImportError(t("settings.import.invalidFile"));
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleConfirmImport = async () => {
    if (!pendingImportData) return;

    setIsLoading(true);
    try {
      const result = await importData(pendingImportData);

      if (result.success) {
        setImportSuccess(true);
        trackSettingsChanged("import_data");
        // Refresh the page to show new data
        setTimeout(() => {
          router.refresh();
        }, 1500);
      } else {
        setImportError(result.error || t("settings.import.error"));
      }
    } catch {
      setImportError(t("settings.import.error"));
    } finally {
      setIsLoading(false);
      setShowImportConfirm(false);
      setPendingImportData(null);
    }
  };

  const handleDeleteAllData = async () => {
    setIsLoading(true);
    try {
      await clearAllData();
      trackSettingsChanged("delete_all_data");
      router.push(`/${locale}/app`);
    } finally {
      setIsLoading(false);
      setShowDeleteDataConfirm(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-gray-950">
      <AppHeader
        locale={locale}
        showBackButton
        backHref={`/${locale}/app`}
        title={t("nav.settings")}
        currentPath="settings"
      />

      <main className="flex-1">
        <div className="mx-auto max-w-lg px-4 py-6 space-y-6">
          {/* Export/Import Section */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">
              💾 {t("settings.backup.title")}
            </h3>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              {t("settings.backup.description")}
            </p>

            <div className="space-y-3">
              {/* Export Button */}
              <button
                onClick={handleExport}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-3 text-sm font-medium text-white hover:bg-violet-700 transition-colors"
              >
                📤 {t("settings.backup.export")}
              </button>

              {/* Import Button */}
              <button
                onClick={handleImportClick}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                📥 {t("settings.backup.import")}
              </button>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Import Error */}
              {importError && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                  ⚠️ {importError}
                </div>
              )}

              {/* Import Success */}
              {importSuccess && (
                <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600 dark:bg-green-900/20 dark:text-green-400">
                  ✅ {t("settings.backup.importSuccess")}
                </div>
              )}
            </div>
          </div>

          {/* Danger Zone - Delete All Data */}
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
            <h3 className="mb-1 font-semibold text-red-800 dark:text-red-300">
              {t("settings.danger.title")}
            </h3>
            <p className="mb-3 text-sm text-red-600 dark:text-red-400">
              {t("settings.danger.descriptionLocal")}
            </p>
            <button
              onClick={() => setShowDeleteDataConfirm(true)}
              className="w-full rounded-lg border border-red-300 bg-white px-4 py-3 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-800 dark:bg-red-950 dark:text-red-300 dark:hover:bg-red-900"
            >
              🗑️ {t("settings.danger.deleteAll")}
            </button>
          </div>
        </div>
      </main>

      <Footer />

      {/* Import Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showImportConfirm}
        onClose={() => {
          setShowImportConfirm(false);
          setPendingImportData(null);
        }}
        onConfirm={handleConfirmImport}
        title={t("settings.backup.importConfirmTitle")}
        message={t("settings.backup.importConfirmMessage")}
        confirmText={t("settings.backup.importConfirm")}
        cancelText={t("common.cancel")}
        variant="danger"
        isLoading={isLoading}
      />

      {/* Delete All Data Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDataConfirm}
        onClose={() => setShowDeleteDataConfirm(false)}
        onConfirm={handleDeleteAllData}
        title={t("settings.danger.confirmTitle")}
        message={t("settings.danger.confirmMessage")}
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        variant="danger"
        isLoading={isLoading}
      />
    </div>
  );
}

// Main export with AuthGate wrapper
export function SettingsPage({ locale }: SettingsPageProps) {
  return (
    <AuthGate locale={locale}>
      <SettingsPageContent locale={locale} />
    </AuthGate>
  );
}
