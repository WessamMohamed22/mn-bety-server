import createApp from "./app.js";
import { env } from "./config/env.js";
import connectDB from "./DB/connection.js";

// server instance
let server;

// SHUTDOWN function

const startServer = async () => {
  // Connect DB:
  await connectDB()

  // create app
  const app = createApp();

  const server = app.listen(env.PORT, () => {
    console.log(`server running on port: ${env.PORT}`);
    console.log(server.address());
  });
};

export default startServer;
