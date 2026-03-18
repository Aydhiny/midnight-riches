import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db", () => {
  const mockDb = {
    query: {
      wallets: {
        findFirst: vi.fn(),
      },
    },
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(() => []),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => [{ id: "game-session-1" }]),
      })),
    })),
  };
  return { db: mockDb };
});

vi.mock("@/lib/server/rate-limiter", () => ({
  checkRateLimit: vi.fn(() => ({ success: true, remaining: 29, resetAt: Date.now() + 60000 })),
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), action: vi.fn(), gameOutcome: vi.fn() },
}));

import { spinAction } from "./spin";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/server/rate-limiter";

const mockAuth = vi.mocked(auth);
const mockWalletFind = vi.mocked(db.query.wallets.findFirst);
const mockRateLimit = vi.mocked(checkRateLimit);

describe("spinAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockReturnValue({ success: true, remaining: 29, resetAt: Date.now() + 60000 });
  });

  it("returns UNAUTHORIZED for unauthenticated request", async () => {
    mockAuth.mockResolvedValue(null as unknown as Awaited<ReturnType<typeof auth>>);

    const result = await spinAction({
      betPerLine: 1,
      bonus: { isActive: false, spinsRemaining: 0, multiplier: 1, totalBonusWin: 0 },
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe("UNAUTHORIZED");
    }
  });

  it("returns RATE_LIMITED when rate limit exceeded", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-1", email: "test@test.com" },
      expires: new Date().toISOString(),
    } as unknown as Awaited<ReturnType<typeof auth>>);
    mockRateLimit.mockReturnValue({ success: false, remaining: 0, resetAt: Date.now() + 60000 });

    const result = await spinAction({
      betPerLine: 1,
      bonus: { isActive: false, spinsRemaining: 0, multiplier: 1, totalBonusWin: 0 },
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe("RATE_LIMITED");
    }
  });

  it("rejects invalid bet amount with VALIDATION_ERROR", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-1", email: "test@test.com" },
      expires: new Date().toISOString(),
    } as unknown as Awaited<ReturnType<typeof auth>>);

    const result = await spinAction({
      betPerLine: -1,
      bonus: { isActive: false, spinsRemaining: 0, multiplier: 1, totalBonusWin: 0 },
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe("VALIDATION_ERROR");
    }
  });

  it("returns INSUFFICIENT_FUNDS via optimistic lock", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-1", email: "test@test.com" },
      expires: new Date().toISOString(),
    } as unknown as Awaited<ReturnType<typeof auth>>);

    vi.mocked(db.update).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      }),
    } as unknown as ReturnType<typeof db.update>);

    const result = await spinAction({
      betPerLine: 1,
      bonus: { isActive: false, spinsRemaining: 0, multiplier: 1, totalBonusWin: 0 },
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe("INSUFFICIENT_FUNDS");
    }
  });

  it("processes a valid spin successfully", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-1", email: "test@test.com" },
      expires: new Date().toISOString(),
    } as unknown as Awaited<ReturnType<typeof auth>>);

    vi.mocked(db.update).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: "wallet-1", balance: "999.50" }]),
        }),
      }),
    } as unknown as ReturnType<typeof db.update>);

    vi.mocked(db.insert).mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: "game-session-1" }]),
      }),
    } as unknown as ReturnType<typeof db.insert>);

    mockWalletFind.mockResolvedValue({
      id: "wallet-1",
      userId: "user-1",
      balance: "999.50",
      currency: "USD",
      updatedAt: new Date(),
    });

    const result = await spinAction({
      betPerLine: 0.1,
      bonus: { isActive: false, spinsRemaining: 0, multiplier: 1, totalBonusWin: 0 },
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.result).toBeDefined();
      expect(result.balance).toBeDefined();
    }
  });
});
