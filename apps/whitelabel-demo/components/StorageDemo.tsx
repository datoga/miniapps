"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@miniapps/ui";
import { getJSON, setJSON, remove } from "@miniapps/storage";
import { trackEvent } from "@miniapps/analytics";

const STORAGE_KEY = "whitelabel-demo-value";

export function StorageDemo() {
  const t = useTranslations("persistence");
  const [inputValue, setInputValue] = useState("");
  const [savedValue, setSavedValue] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isFirstSave, setIsFirstSave] = useState(true);

  // Load saved value on mount
  useEffect(() => {
    const loadSaved = async () => {
      const value = await getJSON<string>(STORAGE_KEY);
      if (value) {
        setSavedValue(value);
        setIsFirstSave(false);
      }
    };
    loadSaved();
  }, []);

  const handleSave = async () => {
    if (!inputValue.trim()) return;

    await setJSON(STORAGE_KEY, inputValue);
    setSavedValue(inputValue);
    setMessage(t("savedSuccess"));

    // Track first save event
    if (isFirstSave) {
      trackEvent("first_value", { value_length: inputValue.length });
      setIsFirstSave(false);
    }

    // Clear message after 3 seconds
    setTimeout(() => setMessage(null), 3000);
  };

  const handleClear = async () => {
    await remove(STORAGE_KEY);
    setSavedValue(null);
    setInputValue("");
    setMessage(t("clearedSuccess"));
    setIsFirstSave(true);

    // Track clear event
    trackEvent("clear_clicked");

    // Clear message after 3 seconds
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
        {t("title")}
      </h2>
      <p className="mb-6 text-gray-600 dark:text-gray-300">{t("description")}</p>

      <div className="space-y-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={t("inputPlaceholder")}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
          />
          <Button onClick={handleSave} disabled={!inputValue.trim()}>
            {t("saveButton")}
          </Button>
          <Button variant="outline" onClick={handleClear} disabled={!savedValue}>
            {t("clearButton")}
          </Button>
        </div>

        {message && (
          <div className="rounded-lg bg-green-50 px-4 py-2 text-green-700 dark:bg-green-900/20 dark:text-green-400">
            {message}
          </div>
        )}

        <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {t("savedValue")}:
          </p>
          <p className="mt-1 text-gray-900 dark:text-white">
            {savedValue || (
              <span className="italic text-gray-400 dark:text-gray-500">
                {t("noSavedValue")}
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

