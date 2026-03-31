import startServer from "./src/server.js";

startServer().catch((error) => {
  console.error("Fatal startup error:", error.message);
  process.exit(1);
});
