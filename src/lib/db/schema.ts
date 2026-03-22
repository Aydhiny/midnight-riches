import {
  pgTable,
  text,
  timestamp,
  decimal,
  jsonb,
  boolean,
  integer,
  primaryKey,
  uuid,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type { AdapterAccountType } from "next-auth/adapters";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  email: text("email").unique().notNull(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  passwordHash: text("password_hash"),
  role: text("role").$type<"user" | "admin">().notNull().default("user"),
  stripeCustomerId: text("stripe_customer_id"),
  referralCode: text("referral_code").unique(),
  twoFactorEnabled: boolean("two_factor_enabled").notNull().default(false),
  twoFactorSecret: text("two_factor_secret"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  ]
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [
    primaryKey({
      columns: [vt.identifier, vt.token],
    }),
  ]
);

export const wallets = pgTable("wallets", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  balance: decimal("balance", { precision: 12, scale: 2 }).notNull().default("1000.00"),
  currency: text("currency").notNull().default("USD"),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type")
      .$type<"deposit" | "withdrawal" | "bet" | "win" | "bonus" | "jackpot" | "purchase" | "gamble">()
      .notNull(),
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("transactions_user_created_idx").on(table.userId, table.createdAt),
  ]
);

export const gameSessions = pgTable(
  "game_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    gameId: text("game_id").notNull().default("fruit-slots"),
    betAmount: decimal("bet_amount", { precision: 12, scale: 2 }).notNull(),
    outcome: text("outcome").$type<"win" | "loss" | "bonus">().notNull(),
    winAmount: decimal("win_amount", { precision: 12, scale: 2 }).notNull().default("0"),
    reelResult: jsonb("reel_result").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("game_sessions_user_created_idx").on(table.userId, table.createdAt),
  ]
);

export const bonusRounds = pgTable(
  "bonus_rounds",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    gameSessionId: uuid("game_session_id")
      .notNull()
      .references(() => gameSessions.id, { onDelete: "cascade" }),
    type: text("type").notNull().default("free_spins"),
    spinsRemaining: integer("spins_remaining").notNull().default(10),
    multiplier: decimal("multiplier", { precision: 4, scale: 2 }).notNull().default("2.00"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("bonus_rounds_user_active_idx").on(table.userId, table.isActive),
  ]
);

export const securityEvents = pgTable(
  "security_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    eventType: text("event_type")
      .$type<
        | "anomaly_detected"
        | "rate_limit_exceeded"
        | "integrity_failure"
        | "suspicious_pattern"
        | "self_exclusion_attempt"
      >()
      .notNull(),
    severity: text("severity").$type<"low" | "medium" | "high" | "critical">().notNull(),
    details: jsonb("details").notNull(),
    ipAddress: text("ip_address"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("security_events_user_idx").on(table.userId, table.createdAt),
    index("security_events_type_idx").on(table.eventType, table.createdAt),
  ]
);

export const provablyFairSeeds = pgTable(
  "provably_fair_seeds",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    gameSessionId: uuid("game_session_id").references(() => gameSessions.id, {
      onDelete: "set null",
    }),
    serverSeed: text("server_seed").notNull(),
    serverSeedHash: text("server_seed_hash").notNull(),
    clientSeed: text("client_seed").notNull(),
    nonce: integer("nonce").notNull().default(0),
    revealed: boolean("revealed").notNull().default(false),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("provably_fair_seeds_user_idx").on(table.userId, table.createdAt),
  ]
);

export const jackpot = pgTable("jackpot", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().default("Grand Jackpot"),
  currentAmount: decimal("current_amount", { precision: 14, scale: 2 })
    .notNull()
    .default("1000.00"),
  contributionRate: decimal("contribution_rate", { precision: 5, scale: 4 })
    .notNull()
    .default("0.0050"),
  triggerProbability: decimal("trigger_probability", { precision: 10, scale: 8 })
    .notNull()
    .default("0.00002000"),
  lastWonBy: uuid("last_won_by").references(() => users.id, {
    onDelete: "set null",
  }),
  lastWonAt: timestamp("last_won_at", { mode: "date" }),
  lastWonAmount: decimal("last_won_amount", { precision: 14, scale: 2 }),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const gamblingLimits = pgTable(
  "gambling_limits",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    limitType: text("limit_type")
      .$type<"deposit" | "loss" | "session">()
      .notNull(),
    limitValue: decimal("limit_value", { precision: 12, scale: 2 }).notNull(),
    periodDays: integer("period_days").notNull().default(1),
    currentUsage: decimal("current_usage", { precision: 12, scale: 2 })
      .notNull()
      .default("0.00"),
    periodResetAt: timestamp("period_reset_at", { mode: "date" }).notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("gambling_limits_user_idx").on(table.userId, table.isActive),
  ]
);

export const selfExclusions = pgTable(
  "self_exclusions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    exclusionType: text("exclusion_type")
      .$type<"temporary" | "permanent">()
      .notNull(),
    startDate: timestamp("start_date", { mode: "date" }).defaultNow().notNull(),
    endDate: timestamp("end_date", { mode: "date" }),
    reason: text("reason"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("self_exclusions_user_active_idx").on(table.userId, table.isActive),
  ]
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type")
      .$type<"feature" | "daily_spin" | "daily_puzzle" | "community_win" | "jackpot" | "promotion" | "system">()
      .notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    metadata: jsonb("metadata"),
    read: boolean("read").notNull().default(false),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("notifications_user_idx").on(table.userId, table.read, table.createdAt),
  ]
);

export const userAchievements = pgTable(
  "user_achievements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    achievementId: text("achievement_id").notNull(),
    unlockedAt: timestamp("unlocked_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("user_achievements_user_idx").on(table.userId),
    index("user_achievements_unique_idx").on(table.userId, table.achievementId),
  ]
);

export const dailyChallengeProgress = pgTable(
  "daily_challenge_progress",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    challengeId: text("challenge_id").notNull(),
    date: text("date").notNull(), // YYYY-MM-DD
    progress: integer("progress").notNull().default(0),
    completed: boolean("completed").notNull().default(false),
    completedAt: timestamp("completed_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("daily_challenge_progress_user_date_idx").on(table.userId, table.date),
  ]
);

export const collectibles = pgTable("collectibles", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").$type<"avatar_frame" | "reel_theme" | "symbol_skin" | "sound_pack">().notNull(),
  rarity: text("rarity").$type<"common" | "rare" | "epic" | "legendary">().notNull().default("common"),
  priceCredits: decimal("price_credits", { precision: 10, scale: 2 }),
  priceUsd: decimal("price_usd", { precision: 10, scale: 2 }),
  imageUrl: text("image_url"),
  previewSymbols: text("preview_symbols").array(), // e.g. ["/images/Cherry.png", ...]
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const userCollectibles = pgTable("user_collectibles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  collectibleId: uuid("collectible_id").notNull().references(() => collectibles.id),
  acquiredAt: timestamp("acquired_at", { mode: "date" }).defaultNow().notNull(),
  equippedSlot: text("equipped_slot").$type<"avatar_frame" | "reel_theme" | "symbol_skin" | "sound_pack" | null>().default(null),
}, (table) => [
  index("user_collectibles_user_idx").on(table.userId),
]);

export const usersRelations = relations(users, ({ one, many }) => ({
  wallet: one(wallets, {
    fields: [users.id],
    references: [wallets.userId],
  }),
  accounts: many(accounts),
  sessions: many(sessions),
  transactions: many(transactions),
  gameSessions: many(gameSessions),
  bonusRounds: many(bonusRounds),
  securityEvents: many(securityEvents),
  provablyFairSeeds: many(provablyFairSeeds),
  gamblingLimits: many(gamblingLimits),
  selfExclusions: many(selfExclusions),
  userAchievements: many(userAchievements),
  dailyChallengeProgress: many(dailyChallengeProgress),
  notifications: many(notifications),
  userCollectibles: many(userCollectibles),
  referrals: many(referrals),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const walletsRelations = relations(wallets, ({ one }) => ({
  user: one(users, {
    fields: [wallets.userId],
    references: [users.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));

export const gameSessionsRelations = relations(gameSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [gameSessions.userId],
    references: [users.id],
  }),
  bonusRounds: many(bonusRounds),
}));

export const bonusRoundsRelations = relations(bonusRounds, ({ one }) => ({
  user: one(users, {
    fields: [bonusRounds.userId],
    references: [users.id],
  }),
  gameSession: one(gameSessions, {
    fields: [bonusRounds.gameSessionId],
    references: [gameSessions.id],
  }),
}));

export const securityEventsRelations = relations(securityEvents, ({ one }) => ({
  user: one(users, {
    fields: [securityEvents.userId],
    references: [users.id],
  }),
}));

export const provablyFairSeedsRelations = relations(provablyFairSeeds, ({ one }) => ({
  user: one(users, {
    fields: [provablyFairSeeds.userId],
    references: [users.id],
  }),
  gameSession: one(gameSessions, {
    fields: [provablyFairSeeds.gameSessionId],
    references: [gameSessions.id],
  }),
}));

export const gamblingLimitsRelations = relations(gamblingLimits, ({ one }) => ({
  user: one(users, {
    fields: [gamblingLimits.userId],
    references: [users.id],
  }),
}));

export const selfExclusionsRelations = relations(selfExclusions, ({ one }) => ({
  user: one(users, {
    fields: [selfExclusions.userId],
    references: [users.id],
  }),
}));

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(users, { fields: [userAchievements.userId], references: [users.id] }),
}));

export const dailyChallengeProgressRelations = relations(dailyChallengeProgress, ({ one }) => ({
  user: one(users, { fields: [dailyChallengeProgress.userId], references: [users.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const collectiblesRelations = relations(collectibles, ({ many }) => ({
  userCollectibles: many(userCollectibles),
}));

export const userCollectiblesRelations = relations(userCollectibles, ({ one }) => ({
  user: one(users, { fields: [userCollectibles.userId], references: [users.id] }),
  collectible: one(collectibles, { fields: [userCollectibles.collectibleId], references: [collectibles.id] }),
}));

export const adminAuditLogs = pgTable(
  "admin_audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    adminId: uuid("admin_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    targetUserId: uuid("target_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    details: jsonb("details"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("admin_audit_logs_admin_idx").on(table.adminId, table.createdAt),
    index("admin_audit_logs_target_idx").on(table.targetUserId, table.createdAt),
  ]
);

export const referrals = pgTable(
  "referrals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    referrerId: uuid("referrer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    referredId: uuid("referred_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    bonusCredited: boolean("bonus_credited").notNull().default(false),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("referrals_referrer_idx").on(table.referrerId),
    index("referrals_code_idx").on(table.code),
    uniqueIndex("referrals_referred_unique").on(table.referredId),
  ]
);

export const referralsRelations = relations(referrals, ({ one }) => ({
  referrer: one(users, { fields: [referrals.referrerId], references: [users.id] }),
  referred: one(users, { fields: [referrals.referredId], references: [users.id] }),
}));

export const adminAuditLogsRelations = relations(adminAuditLogs, ({ one }) => ({
  admin: one(users, { fields: [adminAuditLogs.adminId], references: [users.id] }),
  targetUser: one(users, { fields: [adminAuditLogs.targetUserId], references: [users.id] }),
}));
