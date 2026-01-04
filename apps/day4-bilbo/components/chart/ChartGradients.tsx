import { CYCLE_COLORS } from "./colors";

export function ChartGradients() {
  return (
    <defs>
      {CYCLE_COLORS.map((color, idx) => (
        <linearGradient key={idx} id={`gradient-${idx}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={color.main} stopOpacity={0.4} />
          <stop offset="95%" stopColor={color.main} stopOpacity={0.05} />
        </linearGradient>
      ))}
      <linearGradient id="gradient-reps" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#9ca3af" stopOpacity={0.3} />
        <stop offset="95%" stopColor="#9ca3af" stopOpacity={0} />
      </linearGradient>
    </defs>
  );
}

