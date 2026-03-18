import { describe, it, expect } from "vitest";
import {
  spinRequestSchema,
  depositSchema,
  signUpSchema,
  signInSchema,
  historyFilterSchema,
} from "./index";

describe("spinRequestSchema", () => {
  it("accepts valid bet amounts", () => {
    expect(spinRequestSchema.safeParse({ betPerLine: 0.1 }).success).toBe(true);
    expect(spinRequestSchema.safeParse({ betPerLine: 1 }).success).toBe(true);
    expect(spinRequestSchema.safeParse({ betPerLine: 100 }).success).toBe(true);
  });

  it("rejects bet below minimum", () => {
    const result = spinRequestSchema.safeParse({ betPerLine: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects bet above maximum", () => {
    const result = spinRequestSchema.safeParse({ betPerLine: 101 });
    expect(result.success).toBe(false);
  });

  it("rejects non-number", () => {
    const result = spinRequestSchema.safeParse({ betPerLine: "abc" });
    expect(result.success).toBe(false);
  });

  it("rejects missing field", () => {
    const result = spinRequestSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("depositSchema", () => {
  it("accepts valid amounts", () => {
    expect(depositSchema.safeParse({ amount: 1 }).success).toBe(true);
    expect(depositSchema.safeParse({ amount: 10000 }).success).toBe(true);
  });

  it("rejects zero", () => {
    expect(depositSchema.safeParse({ amount: 0 }).success).toBe(false);
  });

  it("rejects negative amounts", () => {
    expect(depositSchema.safeParse({ amount: -50 }).success).toBe(false);
  });

  it("rejects amounts over 10000", () => {
    expect(depositSchema.safeParse({ amount: 10001 }).success).toBe(false);
  });
});

describe("signUpSchema", () => {
  it("accepts valid signup data", () => {
    const result = signUpSchema.safeParse({
      name: "Test User",
      email: "test@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects short name", () => {
    const result = signUpSchema.safeParse({
      name: "A",
      email: "test@example.com",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = signUpSchema.safeParse({
      name: "Test User",
      email: "notanemail",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = signUpSchema.safeParse({
      name: "Test User",
      email: "test@example.com",
      password: "12345",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing fields", () => {
    expect(signUpSchema.safeParse({}).success).toBe(false);
    expect(signUpSchema.safeParse({ name: "Test" }).success).toBe(false);
  });
});

describe("signInSchema", () => {
  it("accepts valid signin data", () => {
    expect(
      signInSchema.safeParse({ email: "test@example.com", password: "x" }).success
    ).toBe(true);
  });

  it("rejects invalid email", () => {
    expect(
      signInSchema.safeParse({ email: "bad", password: "x" }).success
    ).toBe(false);
  });

  it("rejects empty password", () => {
    expect(
      signInSchema.safeParse({ email: "test@example.com", password: "" }).success
    ).toBe(false);
  });
});

describe("historyFilterSchema", () => {
  it("accepts empty object with defaults", () => {
    const result = historyFilterSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });

  it("accepts valid outcome filter", () => {
    expect(historyFilterSchema.safeParse({ outcome: "win" }).success).toBe(true);
    expect(historyFilterSchema.safeParse({ outcome: "loss" }).success).toBe(true);
    expect(historyFilterSchema.safeParse({ outcome: "bonus" }).success).toBe(true);
  });

  it("rejects invalid outcome", () => {
    expect(historyFilterSchema.safeParse({ outcome: "invalid" }).success).toBe(false);
  });

  it("rejects page < 1", () => {
    expect(historyFilterSchema.safeParse({ page: 0 }).success).toBe(false);
    expect(historyFilterSchema.safeParse({ page: -1 }).success).toBe(false);
  });

  it("rejects limit > 100", () => {
    expect(historyFilterSchema.safeParse({ limit: 101 }).success).toBe(false);
  });
});
