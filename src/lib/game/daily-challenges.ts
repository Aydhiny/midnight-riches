export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  target: number;
  rewardXp: number;
  rewardCredits: number;
  type: "spins" | "wins" | "bonus" | "credits_won" | "games_played";
}

const ALL_CHALLENGES: DailyChallenge[] = [
  { id: "spin_10", title: "Spin Master", description: "Place 10 spins today", icon: "🎰", target: 10, rewardXp: 50, rewardCredits: 25, type: "spins" },
  { id: "win_5", title: "Lucky Five", description: "Win 5 times today", icon: "⭐", target: 5, rewardXp: 75, rewardCredits: 50, type: "wins" },
  { id: "trigger_bonus", title: "Bonus Hunter", description: "Trigger 1 bonus round", icon: "🔮", target: 1, rewardXp: 100, rewardCredits: 75, type: "bonus" },
  { id: "win_100_credits", title: "Credit Collector", description: "Win 100+ credits total", icon: "💰", target: 100, rewardXp: 60, rewardCredits: 30, type: "credits_won" },
  { id: "play_2_games", title: "Game Hopper", description: "Play 2 different game types", icon: "🎮", target: 2, rewardXp: 80, rewardCredits: 40, type: "games_played" },
  { id: "spin_25", title: "Dedicated Player", description: "Place 25 spins today", icon: "🏆", target: 25, rewardXp: 120, rewardCredits: 100, type: "spins" },
  { id: "win_streak", title: "Hot Streak", description: "Win 3 spins in a row", icon: "🔥", target: 3, rewardXp: 150, rewardCredits: 125, type: "wins" },
];

// Get 3 daily challenges based on date (deterministic rotation)
export function getDailyChallenges(date: string): DailyChallenge[] {
  const seed = date.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const indices: number[] = [];
  let n = seed;
  while (indices.length < 3) {
    const idx = n % ALL_CHALLENGES.length;
    if (!indices.includes(idx)) indices.push(idx);
    n = (n * 1103515245 + 12345) & 0x7fffffff;
  }
  return indices.map(i => ALL_CHALLENGES[i]);
}
