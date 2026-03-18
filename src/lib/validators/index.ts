import { z } from "zod";
import { MIN_BET, MAX_BET } from "@/lib/game/symbols";

export const spinRequestSchema = z.object({
  betPerLine: z.number().min(MIN_BET).max(MAX_BET),
});

export const gameSpinSchema = z.object({
  gameType: z.enum(["classic", "five-reel", "cascade", "megaways"]),
  betAmount: z.number().min(0.10).max(500),
  betPerLine: z.number().min(0.01).max(500),
});

export const bonusClaimSchema = z.object({
  bonusRoundId: z.string().uuid(),
});

export const depositSchema = z.object({
  amount: z.number().positive().max(10000),
});

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password must be at most 100 characters")
  .regex(/[A-Z]/, "Password must contain at least 1 uppercase letter")
  .regex(/[a-z]/, "Password must contain at least 1 lowercase letter")
  .regex(/[0-9]/, "Password must contain at least 1 number");

export const signUpSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be at most 50 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: passwordSchema,
});

export const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const historyFilterSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().min(1).max(100).default(20),
  outcome: z.enum(["win", "loss", "bonus"]).optional(),
  gameType: z.enum(["classic", "five-reel", "cascade", "megaways"]).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

export type SpinRequest = z.infer<typeof spinRequestSchema>;
export type GameSpinInput = z.infer<typeof gameSpinSchema>;
export type BonusClaimInput = z.infer<typeof bonusClaimSchema>;
export type DepositRequest = z.infer<typeof depositSchema>;
export type SignUpRequest = z.infer<typeof signUpSchema>;
export type SignInRequest = z.infer<typeof signInSchema>;
export type HistoryFilter = z.infer<typeof historyFilterSchema>;

export const purchaseBundleSchema = z.object({
  bundleId: z.enum(["starter", "popular", "premium", "whale"]),
});
export type PurchaseBundleInput = z.infer<typeof purchaseBundleSchema>;

export const setGamblingLimitSchema = z.object({
  limitType: z.enum(["deposit", "loss", "session"]),
  limitValue: z.number().positive().max(100000),
  periodDays: z.number().int().min(1).max(365),
});
export type SetGamblingLimitInput = z.infer<typeof setGamblingLimitSchema>;

export const selfExcludeSchema = z.object({
  exclusionType: z.enum(["temporary", "permanent"]),
  durationDays: z.number().int().min(1).max(365).optional(),
  reason: z.string().max(500).optional(),
});
export type SelfExcludeInput = z.infer<typeof selfExcludeSchema>;

export const adminUserSearchSchema = z.object({
  query: z.string().max(100).optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().min(1).max(100).default(20),
  role: z.enum(["user", "admin"]).optional(),
});
export type AdminUserSearchInput = z.infer<typeof adminUserSearchSchema>;

export const adminAdjustBalanceSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number(),
  reason: z.string().min(1).max(200),
});
export type AdminAdjustBalanceInput = z.infer<typeof adminAdjustBalanceSchema>;

export const adminSuspendUserSchema = z.object({
  userId: z.string().uuid(),
  suspended: z.boolean(),
  reason: z.string().max(500).optional(),
});
export type AdminSuspendUserInput = z.infer<typeof adminSuspendUserSchema>;
