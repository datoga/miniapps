import type { UnitsUI } from "@/lib/schemas";

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string; dataKey: string }>;
  label?: string;
  unitsUI: UnitsUI;
  t: (key: string) => string;
}

export function CustomTooltip({ active, payload, label, unitsUI, t }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) {return null;}

  return (
    <div className="rounded-xl border border-gray-200 bg-white/95 p-3 shadow-xl backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/95">
      <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
        {t("charts.sessionNumber")} {label}
      </p>
      <div className="space-y-1.5">
        {payload.map((entry, idx) => {
          const isReps = entry.name.toLowerCase().includes("reps");
          return (
            <div key={idx} className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {entry.name}:
              </span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {entry.value} {isReps ? "" : unitsUI}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

