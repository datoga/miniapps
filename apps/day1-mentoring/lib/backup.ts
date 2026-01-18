"use client";

import * as menteesRepo from "./repos/menteesRepo";
import * as sessionsRepo from "./repos/sessionsRepo";
import * as settingsRepo from "./repos/settingsRepo";
import type { Backup } from "./schemas";
import { BackupSchema } from "./schemas";

/**
 * Export all data to backup format
 */
export async function exportBackup(): Promise<Backup> {
  const [mentees, sessions, settings] = await Promise.all([
    menteesRepo.listMentees(),
    sessionsRepo.listAllSessions(),
    settingsRepo.getSettings(),
  ]);

  return {
    schemaVersion: 1,
    appId: "day1-mentoring",
    exportedAt: new Date().toISOString(),
    data: {
      settings: {
        lastSelectedMenteeId: settings.lastSelectedMenteeId,
        showArchived: settings.showArchived,
        programName: settings.programName,
      },
      mentees,
      sessions,
    },
  };
}

/**
 * Download backup as JSON file
 */
export async function downloadBackup(): Promise<void> {
  const backup = await exportBackup();
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `mentorflow-backup-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import backup from file
 */
export async function importBackup(backup: Backup): Promise<void> {
  // Validate backup schema
  const parsed = BackupSchema.safeParse(backup);
  if (!parsed.success) {
    throw new Error("Invalid backup file format");
  }

  const validatedBackup = parsed.data;

  // Replace all data
  await menteesRepo.replaceAllMentees(validatedBackup.data.mentees);
  await sessionsRepo.replaceAllSessions(validatedBackup.data.sessions);

  // Update settings if provided
  if (validatedBackup.data.settings) {
    await settingsRepo.updateSettings(validatedBackup.data.settings);
  }
}

/**
 * Read backup file from input file element
 */
export async function readBackupFile(file: File): Promise<Backup> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        resolve(json as Backup);
      } catch (error) {
        reject(new Error("Failed to parse backup file"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read backup file"));
    reader.readAsText(file);
  });
}
