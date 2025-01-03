import app from "./app";
import config from "./config";
import { disconnect, initializeRedis } from "./helpers/redisCache";
import { logger } from "./helpers/winston";

async function main() {
  try {
    // Initialize Redis before starting server
    await initializeRedis();

    const PORT = config.port || 5000;
    const server = app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      logger.warn("Shutting down server...");
      server.close(async () => {
        await disconnect();
        logger.warn("Server and Redis connection closed");
        process.exit(0);
      });
    };

    // Handle shutdown signals
    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
    process.on("uncaughtException", async (error) => {
      logger.error("Uncaught Exception:", error);
      await shutdown();
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

main();
