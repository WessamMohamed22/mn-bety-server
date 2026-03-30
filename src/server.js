import createApp from "./app.js";
import { env } from "./config/env.js";
import connectDB from "./DB/connection.js";
import { verifyEmailTransporter } from "./services/email/email.service.js";
import { connectRedis } from "./config/redis.js";
import { initSocket } from "./config/socket.js";
// server instance
let server;

// SHUTDOWN function

const startServer = async () => {
  // Connect DB:
  await connectDB();
  await connectRedis();
  await verifyEmailTransporter();

  // create app
  const app = createApp();

  const server = app.listen(env.PORT, () => {
    console.log(`server running on port: ${env.PORT}`);
    console.log(server.address());
  });

  initSocket(server);
};

export default startServer;