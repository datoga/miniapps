// SVG icons for preset exercises
export const presetIcons: Record<string, React.ReactNode> = {
  bench: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      {/* Bench press - horizontal bar with weights */}
      <rect x="2" y="10" width="3" height="4" rx="0.5" />
      <rect x="19" y="10" width="3" height="4" rx="0.5" />
      <line x1="5" y1="12" x2="19" y2="12" />
      <rect x="6" y="9" width="2" height="6" rx="0.5" />
      <rect x="16" y="9" width="2" height="6" rx="0.5" />
    </svg>
  ),
  squat: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      {/* Squat - person with barbell */}
      <circle cx="12" cy="4" r="2" />
      <line x1="4" y1="6" x2="20" y2="6" />
      <rect x="2" y="4" width="2" height="4" rx="0.5" />
      <rect x="20" y="4" width="2" height="4" rx="0.5" />
      <path d="M8 8 L8 14 L6 20" />
      <path d="M16 8 L16 14 L18 20" />
      <line x1="8" y1="14" x2="16" y2="14" />
    </svg>
  ),
  deadlift: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      {/* Deadlift - barbell on ground */}
      <line x1="4" y1="18" x2="20" y2="18" />
      <circle cx="4" cy="18" r="3" />
      <circle cx="20" cy="18" r="3" />
      <rect x="6" y="16" width="2" height="4" rx="0.5" />
      <rect x="16" y="16" width="2" height="4" rx="0.5" />
    </svg>
  ),
  row: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      {/* Row - horizontal pull */}
      <line x1="4" y1="12" x2="20" y2="12" />
      <rect x="2" y="10" width="2" height="4" rx="0.5" />
      <rect x="20" y="10" width="2" height="4" rx="0.5" />
      <path d="M7 12 L10 8 M7 12 L10 16" />
      <rect x="5" y="9" width="2" height="6" rx="0.5" />
      <rect x="17" y="9" width="2" height="6" rx="0.5" />
    </svg>
  ),
  ohp: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      {/* Overhead Press - barbell above head */}
      <circle cx="12" cy="18" r="2" />
      <line x1="4" y1="4" x2="20" y2="4" />
      <rect x="2" y="2" width="2" height="4" rx="0.5" />
      <rect x="20" y="2" width="2" height="4" rx="0.5" />
      <rect x="5" y="2" width="2" height="4" rx="0.5" />
      <rect x="17" y="2" width="2" height="4" rx="0.5" />
      <line x1="10" y1="16" x2="10" y2="8" />
      <line x1="14" y1="16" x2="14" y2="8" />
      <line x1="10" y1="8" x2="8" y2="4" />
      <line x1="14" y1="8" x2="16" y2="4" />
    </svg>
  ),
  custom: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      {/* Dumbbell */}
      <rect x="2" y="9" width="4" height="6" rx="1" />
      <rect x="18" y="9" width="4" height="6" rx="1" />
      <line x1="6" y1="12" x2="18" y2="12" />
    </svg>
  ),
};

// Available emojis for exercise icons
export const availableEmojis = [
  "🏋️", "💪", "🦵", "🏃", "⬆️", "🔥", "💥", "⚡",
  "🎯", "🏆", "⭐", "✨", "🔴", "🟠", "🟡", "🟢",
  "🔵", "🟣", "⚫", "⚪", "🟤", "❤️", "🧡", "💛",
  "💚", "💙", "💜", "🖤", "🤍", "🤎",
];

interface ExerciseIconProps {
  iconPresetKey: string;
  emoji?: string;
  className?: string;
}

export function ExerciseIcon({ iconPresetKey, emoji, className = "w-8 h-8" }: ExerciseIconProps) {
  if (emoji) {
    return <span className={className}>{emoji}</span>;
  }

  return (
    <div className={className}>
      {presetIcons[iconPresetKey] || presetIcons["custom"]}
    </div>
  );
}

