"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Modal } from "@miniapps/ui";
import type { TournamentMode, ParticipantType, LadderType, GameConfig } from "@/lib/schemas";
import { createTournament } from "@/lib/domain/tournaments";
import { gamePresets, gameCategories, getPresetsByCategory, availableGameEmojis } from "@/lib/games";

interface CreateTournamentModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (tournamentId: string) => void;
}

// Get today's date in YYYY-MM-DD format
function getTodayString(): string {
  const today = new Date();
  return today.toISOString().split("T")[0] || "";
}

export function CreateTournamentModal({ open, onClose, onCreated }: CreateTournamentModalProps) {
  const t = useTranslations();
  const [name, setName] = useState("");
  const [mode, setMode] = useState<TournamentMode>("single_elim");
  const [ladderType, setLadderType] = useState<LadderType>("points");
  const [participantType, setParticipantType] = useState<ParticipantType>("individual");
  const [startDate, setStartDate] = useState(getTodayString());
  const [hasEndDate, setHasEndDate] = useState(false);
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);

  // Game selection
  const [gameKey, setGameKey] = useState<string>("");
  const [customGameName, setCustomGameName] = useState("");
  const [customEmoji, setCustomEmoji] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      // Build game config if a game is selected
      let gameConfig: GameConfig | undefined;
      if (gameKey) {
        gameConfig = {
          gameKey,
          customEmoji: customEmoji || undefined,
          customName: gameKey === "custom" ? customGameName || undefined : undefined,
        };
      }

      const tournament = await createTournament({
        name: name.trim(),
        mode,
        participantType,
        ladderType: mode === "ladder" ? ladderType : undefined,
        game: gameConfig,
        startDate: startDate || undefined,
        endDate: hasEndDate && endDate ? endDate : undefined,
      });
      onCreated(tournament.id);
      handleClose();
    } catch (error) {
      console.error("Failed to create tournament:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName("");
    setMode("single_elim");
    setLadderType("points");
    setParticipantType("individual");
    setStartDate(getTodayString());
    setHasEndDate(false);
    setEndDate("");
    setGameKey("");
    setCustomGameName("");
    setCustomEmoji("");
    setShowEmojiPicker(false);
    onClose();
  };

  // Get the currently selected game's preset emoji
  const selectedPreset = gamePresets.find((g) => g.key === gameKey);
  const displayEmoji = customEmoji || selectedPreset?.emoji || "🎮";

  return (
    <Modal open={open} onClose={handleClose} title={t("tournament.create.title")}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tournament Name */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("tournament.create.name")} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("tournament.create.namePlaceholder")}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
            autoFocus
          />
        </div>

        {/* Game Selection */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("tournament.create.game")}
          </label>
          <p className="mb-2 text-xs text-gray-500 dark:text-gray-300">
            {t("tournament.create.gameHint")}
          </p>

          {/* Selected Game Preview + Emoji Picker Toggle */}
          <div className="mb-3 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-2xl hover:border-violet-400 dark:border-gray-600 dark:hover:border-violet-500"
              title={t("tournament.create.changeEmoji")}
            >
              {displayEmoji}
            </button>
            <div className="flex-1">
              {gameKey === "custom" ? (
                <input
                  type="text"
                  value={customGameName}
                  onChange={(e) => setCustomGameName(e.target.value)}
                  placeholder={t("tournament.create.customGameName")}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-violet-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              ) : (
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {gameKey ? t(selectedPreset?.nameKey || "games.custom") : t("tournament.create.selectGame")}
                </span>
              )}
            </div>
          </div>

          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div className="mb-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
              <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-300">
                {t("tournament.create.selectEmoji")}
              </p>
              <div className="flex flex-wrap gap-1">
                {availableGameEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      setCustomEmoji(emoji);
                      setShowEmojiPicker(false);
                    }}
                    className={`flex h-8 w-8 items-center justify-center rounded text-lg hover:bg-violet-100 dark:hover:bg-violet-900/30 ${
                      customEmoji === emoji ? "bg-violet-100 ring-2 ring-violet-500 dark:bg-violet-900/30" : ""
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              {customEmoji && (
                <button
                  type="button"
                  onClick={() => setCustomEmoji("")}
                  className="mt-2 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-200"
                >
                  {t("tournament.create.resetEmoji")}
                </button>
              )}
            </div>
          )}

          {/* Game Categories */}
          <div className="max-h-48 space-y-3 overflow-y-auto rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
            {gameCategories.map((category) => (
              <div key={category.key}>
                <p className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">
                  <span>{category.emoji}</span>
                  {t(category.nameKey)}
                </p>
                <div className="flex flex-wrap gap-1">
                  {getPresetsByCategory(category.key).map((preset) => (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => {
                        setGameKey(preset.key);
                        if (preset.key !== "custom") {
                          setCustomGameName("");
                        }
                      }}
                      className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs transition-colors ${
                        gameKey === preset.key
                          ? "bg-violet-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                      }`}
                    >
                      <span>{preset.emoji}</span>
                      <span>{t(preset.nameKey)}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Clear selection */}
          {gameKey && (
            <button
              type="button"
              onClick={() => {
                setGameKey("");
                setCustomGameName("");
                setCustomEmoji("");
              }}
              className="mt-2 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-200"
            >
              {t("tournament.create.clearGame")}
            </button>
          )}
        </div>

        {/* Tournament Mode */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("tournament.create.mode")}
          </label>
          <p className="mb-2 text-xs text-gray-500 dark:text-gray-300">
            {t("tournament.create.modeHint")}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode("single_elim")}
              className={`rounded-lg border px-3 py-3 text-left transition-colors ${
                mode === "single_elim" || mode === "double_elim"
                  ? "border-violet-500 bg-violet-50 dark:border-violet-400 dark:bg-violet-900/20"
                  : "border-gray-300 bg-white hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
              }`}
            >
              <div className="font-medium text-gray-900 dark:text-white">🏆</div>
              <div className="text-sm text-gray-700 dark:text-gray-300">
                {t("tournament.create.elimination")}
              </div>
            </button>
            <button
              type="button"
              onClick={() => setMode("ladder")}
              className={`rounded-lg border px-3 py-3 text-left transition-colors ${
                mode === "ladder"
                  ? "border-violet-500 bg-violet-50 dark:border-violet-400 dark:bg-violet-900/20"
                  : "border-gray-300 bg-white hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
              }`}
            >
              <div className="font-medium text-gray-900 dark:text-white">📊</div>
              <div className="text-sm text-gray-700 dark:text-gray-300">
                {t("dashboard.mode.ladder")}
              </div>
            </button>
          </div>
        </div>

        {/* Elimination Type (only for elimination modes) */}
        {(mode === "single_elim" || mode === "double_elim") && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("tournament.create.eliminationType")}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode("single_elim")}
                className={`rounded-lg border px-4 py-3 text-left transition-colors ${
                  mode === "single_elim"
                    ? "border-violet-500 bg-violet-50 dark:border-violet-400 dark:bg-violet-900/20"
                    : "border-gray-300 bg-white hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
                }`}
              >
                <div className="font-medium text-gray-900 dark:text-white">🥇</div>
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  {t("tournament.create.singleElim")}
                </div>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-300">
                  {t("tournament.create.singleElimHint")}
                </div>
              </button>
              <button
                type="button"
                onClick={() => setMode("double_elim")}
                className={`rounded-lg border px-4 py-3 text-left transition-colors ${
                  mode === "double_elim"
                    ? "border-violet-500 bg-violet-50 dark:border-violet-400 dark:bg-violet-900/20"
                    : "border-gray-300 bg-white hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
                }`}
              >
                <div className="font-medium text-gray-900 dark:text-white">❤️❤️</div>
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  {t("tournament.create.doubleElim")}
                </div>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-300">
                  {t("tournament.create.doubleElimHint")}
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Ladder Type (only for ladder mode) */}
        {mode === "ladder" && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("tournament.create.ladderType")}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLadderType("points")}
                className={`rounded-lg border px-4 py-3 text-left transition-colors ${
                  ladderType === "points"
                    ? "border-violet-500 bg-violet-50 dark:border-violet-400 dark:bg-violet-900/20"
                    : "border-gray-300 bg-white hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
                }`}
              >
                <div className="font-medium text-gray-900 dark:text-white">🎯</div>
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  {t("tournament.create.ladderTypePoints")}
                </div>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-300">
                  {t("tournament.create.ladderTypePointsHint")}
                </div>
              </button>
              <button
                type="button"
                onClick={() => setLadderType("time")}
                className={`rounded-lg border px-4 py-3 text-left transition-colors ${
                  ladderType === "time"
                    ? "border-violet-500 bg-violet-50 dark:border-violet-400 dark:bg-violet-900/20"
                    : "border-gray-300 bg-white hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
                }`}
              >
                <div className="font-medium text-gray-900 dark:text-white">⏱️</div>
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  {t("tournament.create.ladderTypeTime")}
                </div>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-300">
                  {t("tournament.create.ladderTypeTimeHint")}
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Participant Type */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("tournament.create.participantType")}
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setParticipantType("individual")}
              className={`rounded-lg border px-3 py-2 text-center text-sm transition-colors ${
                participantType === "individual"
                  ? "border-violet-500 bg-violet-50 dark:border-violet-400 dark:bg-violet-900/20"
                  : "border-gray-300 bg-white hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
              }`}
            >
              <div className="text-gray-900 dark:text-white">
                {t("tournament.create.individual")}
              </div>
            </button>
            <button
              type="button"
              onClick={() => setParticipantType("pair")}
              className={`rounded-lg border px-3 py-2 text-center text-sm transition-colors ${
                participantType === "pair"
                  ? "border-violet-500 bg-violet-50 dark:border-violet-400 dark:bg-violet-900/20"
                  : "border-gray-300 bg-white hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
              }`}
            >
              <div className="text-gray-900 dark:text-white">{t("tournament.create.pair")}</div>
            </button>
          </div>
        </div>

        {/* Tournament Date */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("tournament.create.date")}
          </label>
          <div className="flex gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                // If end date is before start date, clear it
                if (endDate && e.target.value > endDate) {
                  setEndDate("");
                }
              }}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* Multiple days toggle */}
          <div className="mt-2">
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <input
                type="checkbox"
                checked={hasEndDate}
                onChange={(e) => {
                  setHasEndDate(e.target.checked);
                  if (!e.target.checked) {
                    setEndDate("");
                  }
                }}
                className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
              />
              {t("tournament.create.multipleDays")}
            </label>
          </div>

          {/* End date (only if multiple days) */}
          {hasEndDate && (
            <div className="mt-2">
              <label className="mb-1 block text-sm text-gray-500 dark:text-gray-300">
                {t("tournament.create.endDate")}
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            {t("common.cancel")}
          </button>
          <button
            type="submit"
            disabled={!name.trim() || loading}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {loading ? t("common.loading") : t("tournament.create.create")}
          </button>
        </div>
      </form>
    </Modal>
  );
}

