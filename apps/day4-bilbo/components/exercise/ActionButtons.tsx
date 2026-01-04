"use client";

import { Button } from "@miniapps/ui";
import { useTranslations } from "next-intl";

interface ActionButtonsProps {
  hasActiveCycle: boolean;
  isFirstSessionOfCycle: boolean;
  onLogSession: () => void;
  onEndCycle: () => void;
  onStartNewCycle: () => void;
}

export function ActionButtons({
  hasActiveCycle,
  isFirstSessionOfCycle,
  onLogSession,
  onEndCycle,
  onStartNewCycle,
}: ActionButtonsProps) {
  const t = useTranslations();

  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {hasActiveCycle && (
        <Button variant="primary" onClick={onLogSession}>
          <span className="md:hidden">✏️</span>
          <span className="hidden md:inline">✏️ {t("home.logSession")}</span>
        </Button>
      )}
      {hasActiveCycle && !isFirstSessionOfCycle && (
        <Button variant="outline" onClick={onEndCycle}>
          <span className="md:hidden">🏁</span>
          <span className="hidden md:inline">🏁 {t("exercise.endCycle")}</span>
        </Button>
      )}
      {!hasActiveCycle && (
        <Button variant="outline" onClick={onStartNewCycle}>
          <span className="md:hidden">🔄</span>
          <span className="hidden md:inline">🔄 {t("exercise.startNewCycle")}</span>
        </Button>
      )}
    </div>
  );
}
