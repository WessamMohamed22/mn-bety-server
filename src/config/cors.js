import { env } from "./env.js";
import { HEADERS } from "../constants/headers.js";

// allowed origins include client and admin urls
const allowedOrigins = [env.CLIENT_URL, env.ADMIN_URL];

/**
 * checks if a given origin is allowed to access the API
 * @param {string | undefined} origin - the request origin header
 * @param {Function} callback - cors callback (error, allowed)
 * @returns {void}
 */
export const corsOptions = {
  origin: (origin, callback) => {
    // allow requests with no origin — Postman, mobile apps, server-to-server
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // log blocked origin so you can debug client misconfiguration
      callback(new Error(`CORS blocked: ${origin} is not allowed`));
    }
  },

  // required for cookies and auth headers to be sent cross-origin
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

  // headers the client is allowed to send
  allowedHeaders: [
    HEADERS.CONTENT_TYPE,
    HEADERS.AUTHORIZATION,
    HEADERS.ACCESS_TOKEN,
    HEADERS.REFRESH_TOKEN,
  ],
};
