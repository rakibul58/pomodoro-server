import app from "./app";
import config from "./config";
import { disconnect, initializeRedis } from "./helpers/redisCache";

async function main() {
  try {
    // Initialize Redis before starting server
    await initializeRedis();

    const PORT = config.port || 5000;
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log("Shutting down server...");
      server.close(async () => {
        await disconnect();
        console.log("Server and Redis connection closed");
        process.exit(0);
      });
    };

    // Handle shutdown signals
    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
    process.on("uncaughtException", async (error) => {
      console.error("Uncaught Exception:", error);
      await shutdown();
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

main();
