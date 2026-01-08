"use client";

import { useState, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { Profession } from "../../lib/professions/schema";
import { t, tMany } from "../../lib/professions/translations";
import { CollapsibleSection } from "./CollapsibleSection";
import { useSwipe } from "../../lib/useSwipe";

interface StrategiesSectionProps {
  profession: Profession;
  id?: string;
  isOpen?: boolean;
  onToggle?: () => void;
}

const timeframeConfig = [
  {
    icon: "🏃",
    gradient: "from-green-500 to-emerald-500",
    bgGradient: "from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20",
    border: "border-green-300 dark:border-green-700",
    text: "text-green-700 dark:text-green-300",
    badge: "bg-green-500",
    ring: "ring-green-500/30",
  },
  {
    icon: "📈",
    gradient: "from-blue-500 to-cyan-500",
    bgGradient: "from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20",
    border: "border-blue-300 dark:border-blue-700",
    text: "text-blue-700 dark:text-blue-300",
    badge: "bg-blue-500",
    ring: "ring-blue-500/30",
  },
  {
    icon: "🎯",
    gradient: "from-violet-500 to-purple-500",
    bgGradient: "from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20",
    border: "border-violet-300 dark:border-violet-700",
    text: "text-violet-700 dark:text-violet-300",
    badge: "bg-violet-500",
    ring: "ring-violet-500/30",
  },
];

export function StrategiesSection({ profession, id = "strategies", isOpen = false, onToggle = () => {} }: StrategiesSectionProps) {
  const locale = useLocale();
  const ui = useTranslations("profession");
  const [activeIndex, setActiveIndex] = useState(0);

  const goNext = useCallback(() => {
    setActiveIndex((prev) => Math.min(prev + 1, profession.adaptationStrategies.length - 1));
  }, [profession.adaptationStrategies.length]);

  const goPrev = useCallback(() => {
    setActiveIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const swipeHandlers = useSwipe({
    onSwipeLeft: goNext,
    onSwipeRight: goPrev,
  });

  const activeStrategy = profession.adaptationStrategies[activeIndex];
  const defaultConfig = {
    icon: "🏃",
    gradient: "from-green-500 to-emerald-500",
    bgGradient: "from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20",
    border: "border-green-300 dark:border-green-700",
    text: "text-green-700 dark:text-green-300",
    badge: "bg-green-500",
    ring: "ring-green-500/30",
  };
  const activeConfig = timeframeConfig[activeIndex] ?? defaultConfig;

  if (!activeStrategy) {
    return null;
  }

  const timeframe = t(activeStrategy.timeframeKey, locale);
  const actions = tMany(activeStrategy.actionsKeys, locale);
  const expectedOutcome = t(activeStrategy.expectedOutcomeKey, locale);

  return (
    <CollapsibleSection
      id={id}
      title={ui("strategies.title")}
      subtitle={ui("strategies.subtitle")}
      icon="🎯"
      isOpen={isOpen}
      onToggle={onToggle}
    >
      {/* Horizontal timeline slider */}
      <div className="relative mt-6 mb-6 overflow-hidden pt-2 -mt-2">
        {/* Progress bar background */}
        <div className="absolute top-8 sm:top-9 left-[20%] right-[20%] h-1 sm:h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full" />

        {/* Progress bar fill */}
        <div
          className="absolute top-8 sm:top-9 left-[20%] h-1 sm:h-1.5 bg-gradient-to-r from-green-500 via-blue-500 to-violet-500 rounded-full transition-all duration-500"
          style={{ width: `${activeIndex * 30}%` }}
        />

        {/* Timeline markers - clickable */}
        <div className="relative flex justify-between px-8 sm:px-12 pt-2">
          {profession.adaptationStrategies.map((strategy, index) => {
            const config = timeframeConfig[index] ?? defaultConfig;
            const label = t(strategy.timeframeKey, locale);
            const isActive = index === activeIndex;
            const isPast = index < activeIndex;

            return (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className="flex flex-col items-center transition-all duration-300 group"
              >
                {/* Marker dot */}
                <div
                  className={`relative z-10 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br ${config.gradient} flex items-center justify-center text-xl sm:text-2xl shadow-lg transition-all duration-300 ${
                    isActive
                      ? `ring-4 ${config.ring} scale-110`
                      : isPast
                        ? "opacity-100"
                        : "opacity-60 grayscale-[30%] group-hover:opacity-100 group-hover:grayscale-0"
                  }`}
                >
                  {config.icon}
                </div>
                {/* Timeframe label */}
                <div
                  className={`mt-2 px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold text-white whitespace-nowrap transition-all duration-300 ${
                    config.badge
                  } ${isActive ? "" : "opacity-80"}`}
                >
                  {label}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active strategy card - with swipe support */}
      <div
        className="relative touch-pan-y"
        {...swipeHandlers}
      >
        <div
          key={activeIndex}
          className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${activeConfig.bgGradient} border-2 ${activeConfig.border} animate-fadeIn`}
        >
          {/* Decorative gradient bar */}
          <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${activeConfig.gradient}`} />

          <div className="p-6">
            {/* Card header */}
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${activeConfig.gradient} flex items-center justify-center text-2xl shadow-lg`}>
                {activeConfig.icon}
              </div>
              <div>
                <h3 className={`text-2xl font-bold ${activeConfig.text}`}>
                  {timeframe}
                </h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {ui("strategies.step", { step: activeIndex + 1, total: profession.adaptationStrategies.length })}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white/70 dark:bg-gray-800/70 rounded-xl p-5 backdrop-blur-sm shadow-sm mb-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">📋</span>
                <h4 className="font-bold text-gray-800 dark:text-gray-100">
                  {ui("strategies.actions")}
                </h4>
              </div>
              <ul className="space-y-3">
                {actions.map((action, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300"
                  >
                    <span className={`flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br ${activeConfig.gradient} flex items-center justify-center text-white text-xs font-bold mt-0.5 shadow-sm`}>
                      {i + 1}
                    </span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Expected outcome */}
            <div className="bg-white/70 dark:bg-gray-800/70 rounded-xl p-5 backdrop-blur-sm shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">✨</span>
                <h4 className="font-bold text-gray-800 dark:text-gray-100">
                  {ui("strategies.outcome")}
                </h4>
              </div>
              <p className={`font-medium ${activeConfig.text}`}>
                {expectedOutcome}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation dots */}
      <div className="flex justify-center gap-2 mt-4">
        {profession.adaptationStrategies.map((_, index) => {
          const dotConfig = timeframeConfig[index] ?? defaultConfig;
          return (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                index === activeIndex
                  ? `w-8 ${dotConfig.badge}`
                  : "bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500"
              }`}
              aria-label={`Go to strategy ${index + 1}`}
            />
          );
        })}
      </div>
    </CollapsibleSection>
  );
}
