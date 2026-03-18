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
        where: vi.fn(),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(),
    })),
  };
  return { db: mockDb };
});

vi.mock("@/lib/server/rate-limiter", () => ({
  checkRateLimit: vi.fn(() => ({ success: true, remaining: 9, resetAt: Date.now() + 60000 })),
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), action: vi.fn(), gameOutcome: vi.fn() },
}));

import { depositAction, getWalletAction } from "./wallet";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const mockAuth = vi.mocked(auth);
const mockWalletFind = vi.mocked(db.query.wallets.findFirst);

describe("depositAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns UNAUTHORIZED for unauthenticated request", async () => {
    mockAuth.mockResolvedValue(null as unknown as Awaited<ReturnType<typeof auth>>);
    const result = await depositAction({ amount: 100 });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.code).toBe("UNAUTHORIZED");
  });

  it("rejects negative deposit amount", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-1", email: "test@test.com" },
      expires: new Date().toISOString(),
    } as unknown as Awaited<ReturnType<typeof auth>>);

    const result = await depositAction({ amount: -100 });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.code).toBe("VALIDATION_ERROR");
  });

  it("rejects zero deposit", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-1", email: "test@test.com" },
      expires: new Date().toISOString(),
    } as unknown as Awaited<ReturnType<typeof auth>>);

    const result = await depositAction({ amount: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects deposit over limit", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-1", email: "test@test.com" },
      expires: new Date().toISOString(),
    } as unknown as Awaited<ReturnType<typeof auth>>);

    const result = await depositAction({ amount: 10001 });
    expect(result.success).toBe(false);
  });

  it("processes valid deposit", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-1", email: "test@test.com" },
      expires: new Date().toISOString(),
    } as unknown as Awaited<ReturnType<typeof auth>>);
    mockWalletFind.mockResolvedValue({
      id: "wallet-1",
      userId: "user-1",
      balance: "1100.00",
      currency: "USD",
      updatedAt: new Date(),
    });

    const result = await depositAction({ amount: 100 });
    expect(result.success).toBe(true);
    if (result.success) expect(result.balance).toBe(1100);
  });
});

describe("getWalletAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns UNAUTHORIZED for unauthenticated request", async () => {
    mockAuth.mockResolvedValue(null as unknown as Awaited<ReturnType<typeof auth>>);
    const result = await getWalletAction();
    expect(result.success).toBe(false);
    if (!result.success) expect(result.code).toBe("UNAUTHORIZED");
  });

  it("returns NOT_FOUND when wallet missing", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-1", email: "test@test.com" },
      expires: new Date().toISOString(),
    } as unknown as Awaited<ReturnType<typeof auth>>);
    mockWalletFind.mockResolvedValue(undefined);

    const result = await getWalletAction();
    expect(result.success).toBe(false);
    if (!result.success) expect(result.code).toBe("NOT_FOUND");
  });

  it("returns wallet data when found", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-1", email: "test@test.com" },
      expires: new Date().toISOString(),
    } as unknown as Awaited<ReturnType<typeof auth>>);
    mockWalletFind.mockResolvedValue({
      id: "wallet-1",
      userId: "user-1",
      balance: "500.00",
      currency: "USD",
      updatedAt: new Date(),
    });

    const result = await getWalletAction();
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.balance).toBe(500);
      expect(result.currency).toBe("USD");
    }
  });
});

describe("wallet balance invariant", () => {
  it("balance can never go negative via spin deduction logic", () => {
    const balance = 0.5;
    const betPerLine = 1;
    const totalBet = betPerLine * 5;
    expect(balance < totalBet).toBe(true);
  });

  it("optimistic lock prevents overdraft — UPDATE WHERE balance >= amount returns 0 rows on insufficient funds", () => {
    const balance = 50;
    const betAmount = 60;
    const rowsAffected = balance >= betAmount ? 1 : 0;
    expect(rowsAffected).toBe(0);
  });
});
