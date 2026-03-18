export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  xp: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first_spin", title: "First Spin!", description: "Place your first bet", icon: "🎰", rarity: "common", xp: 10 },
  { id: "first_win", title: "Winner!", description: "Win your first spin", icon: "⭐", rarity: "common", xp: 25 },
  { id: "big_win", title: "Big Win!", description: "Win 10x your bet on a single spin", icon: "💰", rarity: "rare", xp: 100 },
  { id: "mega_win", title: "Mega Win!", description: "Win 50x your bet on a single spin", icon: "💎", rarity: "epic", xp: 500 },
  { id: "bonus_triggered", title: "Bonus Hunter", description: "Trigger the bonus round", icon: "🔮", rarity: "rare", xp: 75 },
  { id: "win_streak_3", title: "On a Roll", description: "Win 3 spins in a row", icon: "🔥", rarity: "rare", xp: 150 },
  { id: "win_streak_5", title: "Unstoppable", description: "Win 5 spins in a row", icon: "⚡", rarity: "epic", xp: 300 },
  { id: "jackpot", title: "Jackpot!", description: "Win the progressive jackpot", icon: "👑", rarity: "legendary", xp: 5000 },
  { id: "classic_master", title: "Classic Master", description: "Play 50 spins on Classic Slots", icon: "🍒", rarity: "common", xp: 50 },
  { id: "explorer", title: "Game Explorer", description: "Play all 4 game types", icon: "🗺️", rarity: "rare", xp: 200 },
];

export const RARITY_COLORS: Record<Achievement["rarity"], string> = {
  common: "from-gray-400 to-gray-500",
  rare: "from-blue-400 to-violet-500",
  epic: "from-violet-400 to-pink-500",
  legendary: "from-amber-400 to-orange-500",
};

export const RARITY_GLOW: Record<Achievement["rarity"], string> = {
  common: "rgba(156,163,175,0.4)",
  rare: "rgba(139,92,246,0.4)",
  epic: "rgba(236,72,153,0.4)",
  legendary: "rgba(251,191,36,0.5)",
};
