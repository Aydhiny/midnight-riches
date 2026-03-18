export type TransactionType = "deposit" | "withdrawal" | "bet" | "win" | "bonus" | "jackpot" | "purchase";

export type UserRole = "user" | "admin";

export type Currency = "USD" | "EUR" | "BAM";

export type GameSymbol =
  | "cherry"
  | "lemon"
  | "orange"
  | "grape"
  | "watermelon"
  | "wild"
  | "scatter"
  | "seven"
  | "bar";

export type GameType = "classic" | "five-reel" | "cascade" | "megaways";

export type SymbolGrid = GameSymbol[][];

export type ReelResult = GameSymbol[][];

export interface PaylineResult {
  paylineIndex: number;
  symbols: GameSymbol[];
  winAmount: number;
  isWin: boolean;
}

export interface WinLine {
  paylineIndex: number;
  symbols: GameSymbol[];
  positions: [number, number][];
  winAmount: number;
  multiplier: number;
}

export interface WinEvaluation {
  lines: WinLine[];
  scatterWin: number;
  totalWin: number;
  hasWild: boolean;
  scatterCount: number;
}

export interface CascadeStep {
  grid: SymbolGrid;
  wins: WinEvaluation;
  removedPositions: [number, number][];
  multiplier: number;
}

export interface SpinResult {
  reels: ReelResult;
  paylines: PaylineResult[];
  totalWin: number;
  bonusTriggered: boolean;
  scatterCount: number;
  gameType: GameType;
  wins?: WinEvaluation;
  cascades?: CascadeStep[];
  reelHeights?: number[];
  expandedWilds?: number[];
}

export interface BonusState {
  isActive: boolean;
  spinsRemaining: number;
  multiplier: number;
  totalBonusWin: number;
}

export interface SpinRequest {
  betPerLine: number;
  betAmount: number;
  bonus: BonusState;
}

export interface GameConfig {
  id: GameType;
  name: string;
  reels: number;
  rows: number;
  paylines: number;
  symbols: GameSymbol[];
  minBet: number;
  maxBet: number;
  denominations: number[];
  bonusFreeSpins: number;
  bonusMultiplier: number;
  rtp: number;
}

export interface IGameEngine {
  readonly config: GameConfig;
  spin(bet: SpinRequest): SpinResult;
  evaluateWins(grid: SymbolGrid, betPerLine: number): WinEvaluation;
  triggerBonus(grid: SymbolGrid, state: BonusState): BonusResult;
  calculatePayout(wins: WinEvaluation, bet: number): number;
}

export interface BonusResult {
  triggered: boolean;
  newState: BonusState;
}

export interface GameState {
  balance: number;
  betPerLine: number;
  totalBet: number;
  isSpinning: boolean;
  lastResult: SpinResult | null;
  bonus: BonusState;
  autoPlay: boolean;
}

export interface WalletState {
  balance: number;
  currency: Currency;
  isLoading: boolean;
}

export type SpinState = "idle" | "pending" | "animating" | "result";

export interface AutoSpinConfig {
  totalSpins: number;
  remainingSpins: number;
  stopOnWin: boolean;
  stopOnBonus: boolean;
  stopOnBalanceBelow: number;
  stopOnWinAbove: number;
}

export type SoundKey =
  | "SPIN_START"
  | "REEL_STOP_1"
  | "REEL_STOP_2"
  | "REEL_STOP_3"
  | "REEL_STOP_4"
  | "REEL_STOP_5"
  | "WIN_SMALL"
  | "WIN_BIG"
  | "WIN_MEGA"
  | "BONUS_TRIGGER"
  | "COIN_DROP"
  | "BUTTON_CLICK"
  | "AMBIENT_LOOP";

export interface ISoundManager {
  play(sound: SoundKey): void;
  stop(sound: SoundKey): void;
  setVolume(volume: number): void;
  mute(): void;
  unmute(): void;
}

// ── Stripe / Economy ──

export interface CreditBundle {
  id: string;
  name: string;
  credits: number;
  priceUsd: number;
  stripePriceId: string;
  popular?: boolean;
}

export interface StripeCheckoutResult {
  sessionId: string;
  url: string;
}

// ── Provably Fair ──

export interface ProvablyFairSeed {
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
}

export interface ProvablyFairReveal {
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
}

// ── Anti-Cheat ──

export type SecurityEventType =
  | "anomaly_detected"
  | "rate_limit_exceeded"
  | "integrity_failure"
  | "suspicious_pattern"
  | "self_exclusion_attempt";

export type SecuritySeverity = "low" | "medium" | "high" | "critical";

export interface SecurityEvent {
  eventType: SecurityEventType;
  severity: SecuritySeverity;
  details: Record<string, unknown>;
  ipAddress?: string;
}

export interface SpinGuardResult {
  allowed: boolean;
  reason?: string;
  event?: SecurityEvent;
}

export interface AnomalyFlag {
  type: "win_rate" | "payout_ratio" | "frequency" | "pattern";
  value: number;
  threshold: number;
  description: string;
}

// ── Jackpot ──

export interface JackpotState {
  id: string;
  name: string;
  currentAmount: number;
  lastWonAt: Date | null;
  lastWonAmount: number | null;
}

// ── Responsible Gambling ──

export type GamblingLimitType = "deposit" | "loss" | "session";

export type ExclusionType = "temporary" | "permanent";

export interface GamblingLimit {
  limitType: GamblingLimitType;
  limitValue: number;
  periodDays: number;
  currentUsage: number;
  periodResetAt: Date;
  isActive: boolean;
}

export interface SelfExclusion {
  exclusionType: ExclusionType;
  startDate: Date;
  endDate: Date | null;
  reason: string | null;
  isActive: boolean;
}

// ── Admin ──

export interface AdminKPIs {
  totalUsers: number;
  activeUsersToday: number;
  totalRevenue: number;
  totalPayouts: number;
  houseEdge: number;
  activeJackpot: number;
}

export interface AdminUserRow {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  balance: number;
  totalBets: number;
  totalWins: number;
  createdAt: Date;
  isSuspended: boolean;
}
