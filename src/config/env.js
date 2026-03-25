import dotenv from "dotenv";

dotenv.config();

export const env = {
  // Application
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 4000,

  // Database
  DATABASE_URI: process.env.DATABASE_URI,

  // AUTH
  AUTH: {
    RESET_PASSWORD_EXPIRE: process.env.RESET_PASSWORD_EXPIRE || "15m",
  },

  // JWT
  JWT: {
    SECRET_ACCESS: process.env.JWT_SECRET_ACCESS,
    SECRET_REFRESH: process.env.JWT_SECRET_REFRESH,
    ACCESS_EXPIRE: process.env.JWT_ACCESS_EXPIRE || "15m",
    REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE || "7d",
  },

  // hashing
  BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10,

  // Cookies
  COOKIE: {
    REFRESH_MAX_AGE:
      parseInt(process.env.COOKIE_REFRESH_MAX_AGE) || 7 * 24 * 60 * 60 * 1000,
    HTTP_ONLY: process.env.COOKIE_HTTP_ONLY === "true",
    SECURE: process.env.COOKIE_SECURE === "true",
    SAME_SITE: process.env.COOKIE_SAME_SITE || "lax",
  },

  // Email
  EMAIL: {
    HOST: process.env.EMAIL_HOST,
    PORT: process.env.EMAIL_PORT,
    SECURE: process.env.EMAIL_SECURE === "true",
    USER: process.env.EMAIL_USER,
    PASSWORD: process.env.EMAIL_PASSWORD,
    FROM: process.env.FROM,
  },

  // Cloudinary
  CLOUDINARY: {
    CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    API_KEY: process.env.CLOUDINARY_API_KEY,
    API_SECRET: process.env.CLOUDINARY_API_SECRET,
  },

  // Stripe
  STRIPE: {
    SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  },

  // Frontend
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:4000",

  // Development flags
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",
};
