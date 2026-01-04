"use client";

import { Button } from "@miniapps/ui";
import { useTranslations } from "next-intl";

interface ActionButtonsProps {
  hasActiveCycle: boolean;
  isResting: boolean;
  isFirstSessionOfCycle: boolean;
  onLogSession: () => void;
  onEndCycle: () => void;
  onStartNewCycle: () => void;
  onStartRest: () => void;
}

export function ActionButtons({
  hasActiveCycle,
  isResting,
  isFirstSessionOfCycle,
  onLogSession,
  onEndCycle,
  onStartNewCycle,
  onStartRest,
}: ActionButtonsProps) {
  const t = useTranslations();

  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {hasActiveCycle && !isResting && (
        <Button variant="primary" onClick={onLogSession}>
          <span className="md:hidden">✏️</span>
          <span className="hidden md:inline">✏️ {t("home.logSession")}</span>
        </Button>
      )}
      {hasActiveCycle && !isResting && !isFirstSessionOfCycle && (
        <Button variant="outline" onClick={onEndCycle}>
          <span className="md:hidden">🏁</span>
          <span className="hidden md:inline">🏁 {t("exercise.endCycle")}</span>
        </Button>
      )}
      {!hasActiveCycle && !isResting && (
        <>
          <Button variant="outline" onClick={onStartNewCycle}>
            <span className="md:hidden">🔄</span>
            <span className="hidden md:inline">🔄 {t("exercise.startNewCycle")}</span>
          </Button>
          <Button variant="outline" onClick={onStartRest}>
            <span className="md:hidden">😴</span>
            <span className="hidden md:inline">😴 {t("rest.takeRest")}</span>
          </Button>
        </>
      )}
    </div>
  );
}

