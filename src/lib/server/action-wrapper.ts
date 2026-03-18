import { auth } from "@/lib/auth";
import { checkRateLimit } from "./rate-limiter";
import { logger } from "@/lib/logger";
import type { z } from "zod";

export interface ActionSuccess<T> {
  success: true;
  data: T;
}

export interface ActionError {
  success: false;
  error: string;
  code: "UNAUTHORIZED" | "RATE_LIMITED" | "VALIDATION_ERROR" | "NOT_FOUND" | "INSUFFICIENT_FUNDS" | "INTERNAL_ERROR";
}

export type ActionResult<T> = ActionSuccess<T> | ActionError;

interface ActionOptions<TInput, TOutput> {
  name: string;
  schema?: z.ZodType<TInput>;
  rateLimit?: { maxRequests?: number; windowMs?: number };
  requireAuth?: boolean;
  handler: (args: {
    input: TInput;
    userId: string;
  }) => Promise<TOutput>;
}

export function createAction<TInput, TOutput>(
  options: ActionOptions<TInput, TOutput>
) {
  const { name, schema, rateLimit, requireAuth = true, handler } = options;

  return async (rawInput: TInput): Promise<ActionResult<TOutput>> => {
    const start = performance.now();

    try {
      let userId = "anonymous";

      if (requireAuth) {
        const session = await auth();
        if (!session?.user?.id) {
          return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };
        }
        userId = session.user.id;
      }

      const rateLimitResult = checkRateLimit(`${name}:${userId}`, rateLimit);
      if (!rateLimitResult.success) {
        logger.warn(`Rate limited: ${name}`, { userId, action: name });
        return { success: false, error: "Too many requests", code: "RATE_LIMITED" };
      }

      let input = rawInput;
      if (schema) {
        const parsed = schema.safeParse(rawInput);
        if (!parsed.success) {
          return { success: false, error: "Invalid input", code: "VALIDATION_ERROR" };
        }
        input = parsed.data;
      }

      const data = await handler({ input, userId });

      const duration = Math.round(performance.now() - start);
      logger.action(name, userId, duration);

      return { success: true, data };
    } catch (err) {
      const duration = Math.round(performance.now() - start);
      const message = err instanceof Error ? err.message : "Unknown error";
      logger.error(`Action failed: ${name}`, {
        action: name,
        duration,
        metadata: { error: message },
      });
      return { success: false, error: "Internal error", code: "INTERNAL_ERROR" };
    }
  };
}
