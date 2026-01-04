"use client";

import { format2, formatWeight, fromKg } from "@/lib/math";
import type { Session, UnitsUI } from "@/lib/schemas";
import { useTranslations } from "next-intl";

interface SessionRowProps {
  session: Session;
  unitsUI: UnitsUI;
  onEdit: () => void;
  onDelete: () => void;
}

export function SessionRow({ session, unitsUI, onEdit, onDelete }: SessionRowProps) {
  const t = useTranslations();
  const date = new Date(session.datetime);
  const dateStrFull = date.toLocaleDateString(); // With year for desktop
  const dateStrShort = date.toLocaleDateString(undefined, { day: "numeric", month: "numeric" }); // Without year for mobile
  const hasTime = !session.datetime.endsWith("T00:00:00");
  const timeStr = hasTime
    ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <tr className="border-b border-gray-100 dark:border-gray-800">
      <td className="px-2 py-3 text-gray-900 dark:text-white">
        <span className="md:hidden">{dateStrShort}</span>
        <span className="hidden md:inline">{dateStrFull}</span>
        {timeStr && <span className="ml-1 text-xs text-gray-500 md:ml-2">{timeStr}</span>}
      </td>
      <td className="px-2 py-3 text-right font-mono text-gray-900 dark:text-white">
        {formatWeight(session.loadUsedKg, unitsUI)}
      </td>
      <td className="px-2 py-3 text-right text-gray-900 dark:text-white">{session.reps}</td>
      <td className="px-2 py-3 text-right font-mono text-gray-600 dark:text-gray-400">
        {format2(fromKg(session.workKg, unitsUI))}
      </td>
      <td className="px-2 py-3 text-center">
        <span
          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
            session.phase === "bilbo"
              ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
              : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
          }`}
        >
          {session.phase === "bilbo" ? t("session.phaseBilbo") : t("session.phaseStrength")}
        </span>
      </td>
      <td className="px-2 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onEdit}
            className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
            title={t("common.edit")}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
            title={t("common.delete")}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  );
}


