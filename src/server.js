import createApp from "./app.js";
import { env } from "./config/env.js";
import connectDB from "./DB/connection.js";
import { verifyEmailTransporter } from "./services/email/email.service.js";
import { connectRedis } from "./config/redis.js";
import { initSocket } from "./config/socket.js";

// server instance
let server;

// GRACEFUL SHUTDOWN
// called by OS signals (SIGTERM, SIGINT)
// stops accepting new requests, finishes current ones, then exits
const shutdown = (signal) => {
  console.warn(`${signal} received — starting graceful shutdown...`);

  if (!server) {
    process.exit(0);
  }

  server.close(() => {
    console.info("All requests finished — server closed cleanly");
    process.exit(0); // 0 = success, clean exit
  });

  // Safety net — if requests hang and server.close() never finishes,
  // force kill after 10 seconds to avoid hanging forever
  setTimeout(() => {
    console.error("Graceful shutdown timed out — forcing exit");
    process.exit(1); // 1 = failure, forced exit
  }, env.SHETDOWN_TIMEOUT);
};

// OS SIGNALS
// host sends these when stopping the server
// SIGTERM → planned stop (deploy, restart, scale)
// SIGINT  → ctrl+c in local terminal
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// UNHANDLED ERRORS
// bugs you missed — no try/catch, no .catch() on a promise
// log clearly so you can find the exact file + line in logs
// then exit so the host restarts with clean state
// never let the server keep running with a bug in unknown state
process.on("uncaughtException", (error) => {
  console.error("UNCAUGHT EXCEPTION — server will restart", {
    message: error.message,
    stack: error.stack, // exact file + line number
  });
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED REJECTION — server will restart", {
    reason,
  });
  process.exit(1);
});

// STARTSERVER
// order matters:
// 1. connect DB first - routes need DB to work
// 2. create app - registers middleware and routes
// 3. start listening - only accept requests when ready
const startServer = async () => {
  // Connect DB:
  await connectDB();
  await connectRedis();
  await verifyEmailTransporter();
  // create app
  const app = createApp();

  server = app.listen(env.PORT, () => {
    console.log(`server running on port: ${env.PORT}`);
    console.log(server.address());
  });

  initSocket(server);
};

export default startServer;
