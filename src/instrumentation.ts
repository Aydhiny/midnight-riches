export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { logger } = await import("@/lib/logger");
    logger.info("Server started", {
      metadata: {
        nodeVersion: process.version,
        env: process.env.NODE_ENV,
      },
    });
  }
}
