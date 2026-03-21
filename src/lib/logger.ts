type LogLevel = "info" | "warn" | "error" | "debug";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  userId?: string;
  action?: string;
  duration?: number;
  metadata?: Record<string, unknown>;
}

function formatEntry(entry: LogEntry): string {
  if (process.env.NODE_ENV === "production") {
    return JSON.stringify(entry);
  }
  const parts = [`[${entry.level.toUpperCase()}]`, entry.message];
  if (entry.userId) parts.push(`user=${entry.userId}`);
  if (entry.action) parts.push(`action=${entry.action}`);
  if (entry.duration !== undefined) parts.push(`${entry.duration}ms`);
  if (entry.metadata && Object.keys(entry.metadata).length > 0) {
    parts.push(JSON.stringify(entry.metadata));
  }
  return parts.join(" ");
}

function createEntry(level: LogLevel, message: string, meta?: Partial<Omit<LogEntry, "level" | "message" | "timestamp">>): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  };
}

export const logger = {
  info(message: string, meta?: Partial<Omit<LogEntry, "level" | "message" | "timestamp">>) {
    const entry = createEntry("info", message, meta);
    console.log(formatEntry(entry));
  },
  warn(message: string, meta?: Partial<Omit<LogEntry, "level" | "message" | "timestamp">>) {
    const entry = createEntry("warn", message, meta);
    console.warn(formatEntry(entry));
  },
  error(message: string, meta?: Partial<Omit<LogEntry, "level" | "message" | "timestamp">>) {
    const entry = createEntry("error", message, meta);
    console.error(formatEntry(entry));
  },
  debug(message: string, meta?: Partial<Omit<LogEntry, "level" | "message" | "timestamp">>) {
    if (process.env.NODE_ENV !== "production") {
      const entry = createEntry("debug", message, meta);
      console.debug(formatEntry(entry));
    }
  },
  action(actionName: string, userId: string, duration: number, metadata?: Record<string, unknown>) {
    const entry = createEntry("info", `Action: ${actionName}`, {
      userId,
      action: actionName,
      duration,
      metadata,
    });
    console.log(formatEntry(entry));
  },
  gameOutcome(userId: string, bet: number, win: number, metadata?: Record<string, unknown>) {
    const entry = createEntry("info", `Game: bet=${bet} win=${win}`, {
      userId,
      action: "game_outcome",
      metadata: { bet, win, ...metadata },
    });
    console.log(formatEntry(entry));
  },
};
