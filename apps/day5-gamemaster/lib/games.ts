// Game catalog with icons/emojis
export interface GamePreset {
  key: string;
  emoji: string;
  nameKey: string; // i18n key for the name
  category: "videogame" | "tabletop" | "sport" | "other";
}

// Preset games catalog
export const gamePresets: GamePreset[] = [
  // Video Games
  { key: "mario_kart", emoji: "🏎️", nameKey: "games.mario_kart", category: "videogame" },
  { key: "mario_strikers", emoji: "⚽", nameKey: "games.mario_strikers", category: "videogame" },
  { key: "nes_edition", emoji: "🕹️", nameKey: "games.nes_edition", category: "videogame" },
  { key: "smash_bros", emoji: "👊", nameKey: "games.smash_bros", category: "videogame" },
  { key: "fifa", emoji: "⚽", nameKey: "games.fifa", category: "videogame" },
  { key: "cod", emoji: "🎮", nameKey: "games.cod", category: "videogame" },
  { key: "fortnite", emoji: "🔫", nameKey: "games.fortnite", category: "videogame" },
  { key: "minecraft", emoji: "⛏️", nameKey: "games.minecraft", category: "videogame" },
  { key: "rocket_league", emoji: "🚗", nameKey: "games.rocket_league", category: "videogame" },
  { key: "lol", emoji: "🧙", nameKey: "games.lol", category: "videogame" },
  { key: "valorant", emoji: "🎯", nameKey: "games.valorant", category: "videogame" },
  { key: "tetris", emoji: "🧱", nameKey: "games.tetris", category: "videogame" },
  { key: "street_fighter", emoji: "🥊", nameKey: "games.street_fighter", category: "videogame" },
  { key: "pokemon", emoji: "⚡", nameKey: "games.pokemon", category: "videogame" },

  // Tabletop / Board Games
  { key: "chess", emoji: "♟️", nameKey: "games.chess", category: "tabletop" },
  { key: "poker", emoji: "🃏", nameKey: "games.poker", category: "tabletop" },
  { key: "uno", emoji: "🎴", nameKey: "games.uno", category: "tabletop" },
  { key: "monopoly", emoji: "🏠", nameKey: "games.monopoly", category: "tabletop" },
  { key: "scrabble", emoji: "🔤", nameKey: "games.scrabble", category: "tabletop" },
  { key: "catan", emoji: "🏝️", nameKey: "games.catan", category: "tabletop" },
  { key: "magic", emoji: "✨", nameKey: "games.magic", category: "tabletop" },
  { key: "darts", emoji: "🎯", nameKey: "games.darts", category: "tabletop" },
  { key: "pool", emoji: "🎱", nameKey: "games.pool", category: "tabletop" },

  // Sports
  { key: "football", emoji: "⚽", nameKey: "games.football", category: "sport" },
  { key: "basketball", emoji: "🏀", nameKey: "games.basketball", category: "sport" },
  { key: "tennis", emoji: "🎾", nameKey: "games.tennis", category: "sport" },
  { key: "ping_pong", emoji: "🏓", nameKey: "games.ping_pong", category: "sport" },
  { key: "badminton", emoji: "🏸", nameKey: "games.badminton", category: "sport" },
  { key: "volleyball", emoji: "🏐", nameKey: "games.volleyball", category: "sport" },
  { key: "bowling", emoji: "🎳", nameKey: "games.bowling", category: "sport" },
  { key: "golf", emoji: "⛳", nameKey: "games.golf", category: "sport" },
  { key: "racing", emoji: "🏁", nameKey: "games.racing", category: "sport" },

  // Other / Generic
  { key: "trivia", emoji: "❓", nameKey: "games.trivia", category: "other" },
  { key: "karaoke", emoji: "🎤", nameKey: "games.karaoke", category: "other" },
  { key: "dance", emoji: "💃", nameKey: "games.dance", category: "other" },
  { key: "escape_room", emoji: "🔐", nameKey: "games.escape_room", category: "other" },
  { key: "custom", emoji: "🎲", nameKey: "games.custom", category: "other" },
];

// Available emojis for custom games
export const availableGameEmojis = [
  // Gaming
  "🎮", "🕹️", "👾", "🎯", "🎲", "🃏", "🎴", "🀄",
  // Sports
  "⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🏓", "🏸",
  "🏒", "🥊", "🥋", "⛳", "🎳", "🏹", "🎣", "🏁",
  // Vehicles
  "🚗", "🏎️", "🏍️", "🚀", "✈️", "🚁", "⛵", "🛹",
  // Objects
  "⚔️", "🗡️", "🔫", "💣", "🧨", "🎪", "🎭", "🎨",
  // Nature
  "🔥", "⚡", "💎", "⭐", "🌟", "✨", "💫", "🌈",
  // Characters
  "🧙", "🧝", "🦸", "🦹", "👻", "👽", "🤖", "💀",
  // Other
  "🏆", "🥇", "🥈", "🥉", "🎖️", "🏅", "🎗️", "🎁",
];

// Get preset by key
export function getGamePreset(key: string): GamePreset | undefined {
  return gamePresets.find((g) => g.key === key);
}

// Get emoji for a game (custom emoji takes precedence)
export function getGameEmoji(gameKey?: string, customEmoji?: string): string {
  if (customEmoji) return customEmoji;
  if (!gameKey) return "🎮";
  const preset = getGamePreset(gameKey);
  return preset?.emoji || "🎮";
}

// Categories for grouping in UI
export const gameCategories = [
  { key: "videogame", nameKey: "games.category.videogame", emoji: "🎮" },
  { key: "tabletop", nameKey: "games.category.tabletop", emoji: "🎲" },
  { key: "sport", nameKey: "games.category.sport", emoji: "⚽" },
  { key: "other", nameKey: "games.category.other", emoji: "✨" },
] as const;

// Get presets by category
export function getPresetsByCategory(category: string): GamePreset[] {
  return gamePresets.filter((g) => g.category === category);
}

