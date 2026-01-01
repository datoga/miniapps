import { getDB } from "../db";
import type { Settings } from "../schemas";

const SETTINGS_KEY = "app_settings";

const defaultSettings: Settings = {
  lastSelectedMenteeId: null,
  showArchived: false,
  programName: "MentorFlow",
};

/**
 * Get current settings
 */
export async function getSettings(): Promise<Settings> {
  try {
    const db = await getDB();
    const stored = await db.get("settings", SETTINGS_KEY);
    return { ...defaultSettings, ...stored };
  } catch {
    return defaultSettings;
  }
}

/**
 * Update settings (partial update)
 */
export async function updateSettings(partial: Partial<Settings>): Promise<Settings> {
  const db = await getDB();
  const current = await getSettings();
  const updated = { ...current, ...partial };
  await db.put("settings", updated, SETTINGS_KEY);
  return updated;
}

/**
 * Set last selected mentee ID
 */
export async function setLastSelectedMenteeId(menteeId: string | null): Promise<void> {
  await updateSettings({ lastSelectedMenteeId: menteeId });
}

/**
 * Set show archived toggle
 */
export async function setShowArchived(show: boolean): Promise<void> {
  await updateSettings({ showArchived: show });
}

/**
 * Set program name
 */
export async function setProgramName(name: string): Promise<void> {
  await updateSettings({ programName: name });
}

