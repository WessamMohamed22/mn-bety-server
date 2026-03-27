import { createClient } from "redis";
import { env } from "./env.js";

// Connects to default localhost:6379, or your cloud Redis URL
const redisClient = createClient({
  url: env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("error", (err) => console.error("Redis Client Error", err));
redisClient.on("connect", () => console.log("Redis connected successfully"));

export const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
};

export default redisClient;