"use client";

import { trackAppView, trackEvent } from "@miniapps/analytics";
import { ConfirmDialog } from "@miniapps/ui";
import { useTranslations } from "next-intl";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { searchItems, sortItems } from "../lib/search";
import type { EditorMode, QrItem, SortBy, SortDir } from "../lib/types";
import { useQrLibrary } from "../lib/useQrLibrary";
import { AddCard } from "./AddCard";
import { AddModeModal } from "./AddModeModal";
import { DetailModal } from "./DetailModal";
import { EditorModal } from "./EditorModal";
import { QrCard } from "./QrCard";
import { SortDropdown } from "./SortDropdown";

export const QRKitApp = memo(function QRKitApp() {
  const t = useTranslations();
  const { items, prefs, isLoading, addItem, deleteItem, updateName, setSortBy, setSortDir } =
    useQrLibrary();

  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddMode, setShowAddMode] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    item: QrItem;
    from: "card" | "detail";
  } | null>(null);

  // Derive selected item from items array (ensures it always reflects current state)
  const selectedItem = useMemo(
    () => (selectedItemId ? items.find((i) => i.id === selectedItemId) ?? null : null),
    [items, selectedItemId]
  );

  // Track app view on mount
  useEffect(() => {
    trackAppView("QRKit");
  }, []);

  // Filtered and sorted items
  const filteredItems = useMemo(() => {
    const filtered = searchItems(items, searchQuery);
    return sortItems(filtered, prefs.sortBy, prefs.sortDir);
  }, [items, searchQuery, prefs.sortBy, prefs.sortDir]);

  // Handlers
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  const handleSearchBlur = useCallback(() => {
    trackEvent("qr_search", {
      has_query: searchQuery.trim().length > 0 ? 1 : 0,
    });
  }, [searchQuery]);

  const handleSortChange = useCallback(
    (sortBy: SortBy, sortDir: SortDir) => {
      setSortBy(sortBy);
      setSortDir(sortDir);
    },
    [setSortBy, setSortDir]
  );

  const handleAddClick = useCallback(() => {
    setShowAddMode(true);
  }, []);

  const handleSelectCreate = useCallback(() => {
    setShowAddMode(false);
    setEditorMode("create");
    trackEvent("qr_add_open", { mode: "create" });
  }, []);

  const handleSelectScan = useCallback(() => {
    setShowAddMode(false);
    setEditorMode("scan");
    trackEvent("qr_add_open", { mode: "scan" });
  }, []);

  const handleSelectImport = useCallback(() => {
    setShowAddMode(false);
    setEditorMode("import");
    trackEvent("qr_add_open", { mode: "import" });
  }, []);

  const handleEditorClose = useCallback(() => {
    setEditorMode(null);
  }, []);

  const handleEditorSave = useCallback(
    (item: QrItem) => {
      addItem(item);
      setEditorMode(null);
    },
    [addItem]
  );

  const handleCardClick = useCallback((item: QrItem) => {
    setSelectedItemId(item.id);
  }, []);

  const handleDetailClose = useCallback(() => {
    setSelectedItemId(null);
  }, []);

  const handleDeleteRequest = useCallback((item: QrItem, from: "card" | "detail") => {
    setDeleteConfirm({ item, from });
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (deleteConfirm) {
      deleteItem(deleteConfirm.item.id);
      trackEvent("qr_delete", { from: deleteConfirm.from });
      setDeleteConfirm(null);
      if (selectedItemId === deleteConfirm.item.id) {
        setSelectedItemId(null);
      }
    }
  }, [deleteConfirm, deleteItem, selectedItemId]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen relative">
        {/* Background Gradients */}
        <div className="fixed inset-0 bg-gradient-to-br from-primary-50/50 via-transparent to-sky-50/30 dark:from-primary-950/20 dark:via-transparent dark:to-sky-950/10 -z-10 pointer-events-none" />
        <div className="fixed top-20 left-10 w-96 h-96 bg-primary-200/20 dark:bg-primary-800/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="fixed bottom-20 right-10 w-96 h-96 bg-sky-200/20 dark:bg-sky-800/10 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="mx-auto max-w-6xl px-6 py-8 sm:px-8">
          {/* Header */}
          <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                {t("library.title")}
              </h1>
              <p className="hidden sm:block text-gray-600 dark:text-gray-400 mt-1">{t("library.subtitle")}</p>
            </div>
          </div>

          {/* Search + Sort */}
          <div className="mb-6 flex gap-2 sm:gap-3">
            <div className="relative flex-1 min-w-0">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onBlur={handleSearchBlur}
                placeholder={t("library.searchPlaceholder")}
                className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm sm:text-base"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>

            {/* Sort dropdown */}
            <SortDropdown
              sortBy={prefs.sortBy}
              sortDir={prefs.sortDir}
              onSortChange={handleSortChange}
            />
          </div>

          {/* Items grid */}
          {filteredItems.length === 0 && !searchQuery && (
            // Empty state
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-24 h-24 rounded-3xl bg-gray-100 dark:bg-gray-800/60 flex items-center justify-center mb-6 border border-gray-200 dark:border-gray-700">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-gray-400 dark:text-gray-500"
                >
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                  <rect x="14" y="14" width="3" height="3" />
                  <rect x="18" y="14" width="3" height="3" />
                  <rect x="14" y="18" width="3" height="3" />
                  <rect x="18" y="18" width="3" height="3" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {t("library.emptyTitle")}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-sm">
                {t("library.emptyDescription")}
              </p>
              <button
                onClick={handleAddClick}
                className="px-6 py-3 bg-primary-500 text-white font-semibold rounded-xl hover:bg-primary-600 transition-colors"
              >
                {t("library.createFirst")}
              </button>
            </div>
          )}

          {filteredItems.length === 0 && searchQuery && (
            // No results state
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800/60 flex items-center justify-center mb-4 border border-gray-200 dark:border-gray-700">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-gray-400 dark:text-gray-500"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {t("library.noResults")}
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                {t("library.noResultsDescription")}
              </p>
            </div>
          )}

          {filteredItems.length > 0 && (
            // Grid
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredItems.map((item) => (
                <QrCard
                  key={item.id}
                  item={item}
                  onClick={() => handleCardClick(item)}
                  onDelete={() => handleDeleteRequest(item, "card")}
                />
              ))}
              <AddCard onClick={handleAddClick} />
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddModeModal
        open={showAddMode}
        onClose={() => setShowAddMode(false)}
        onSelectCreate={handleSelectCreate}
        onSelectScan={handleSelectScan}
        onSelectImport={handleSelectImport}
      />

      <EditorModal
        open={editorMode !== null}
        mode={editorMode || "create"}
        onClose={handleEditorClose}
        onSave={handleEditorSave}
      />

      <DetailModal
        open={selectedItem !== null}
        onClose={handleDetailClose}
        item={selectedItem}
        onUpdateName={updateName}
        onDelete={(id) => {
          const item = items.find((i) => i.id === id);
          if (item) {
            handleDeleteRequest(item, "detail");
          }
        }}
      />

      <ConfirmDialog
        open={deleteConfirm !== null}
        title={t("confirm.deleteTitle")}
        message={t("confirm.deleteMessage")}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirm(null)}
        variant="danger"
      />
    </>
  );
});
