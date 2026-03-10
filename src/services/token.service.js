/**
 * @file token.service.js
 * @description handles all JWT token operations — generate, verify, and decode.
 */

import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { JWT_ERRORS } from "../constants/errorTypes.js";
import { createUnauthorizedError } from "../errors/error.factory.js";
import { MESSAGES } from "../constants/messages.js";

// ─── Generate Tokens ──────────────────────────────────────────────────────────

// Generates an access token for authenticated requests.
export const generateAccessToken = (payload) => {
  return jwt.sign(payload, env.JWT.SECRET_ACCESS, {
    expiresIn: env.JWT.ACCESS_EXPIRE,
  });
};

// Generates a refresh token for obtaining new access tokens.
export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, env.JWT.SECRET_REFRESH, {
    expiresIn: env.JWT.REFRESH_EXPIRE,
  });
};

// ─── Verify Tokens ────────────────────────────────────────────────────────────

// ----- Decode Token
export const decodeToken = (token) => {
  return jwt.decode(token);
};
  
/**
 * Verifies a token aganist secret Throws ApiError if invalid, expired.
 * @param {string} token
 * @param {string} secret
 */
export const verifyToken = (token, secret) => {
  try {
    return jwt.verify(token, secret);
  } catch (err) {
    if (err.name === JWT_ERRORS.EXPIRED)
      throw createUnauthorizedError(MESSAGES.AUTH.TOKEN_EXPIRED);

    if (err.name === JWT_ERRORS.INVALID)
      throw createUnauthorizedError(MESSAGES.AUTH.INVALID_TOKEN);

    throw createUnauthorizedError(MESSAGES.AUTH.TOKEN_FAILED);
  }
};


// ----- Verify Helpers
export const verifyAccessToken = (token) =>
  verifyToken(token, env.JWT.SECRET_ACCESS);

export const verifyRefreshToken = (token) =>
  verifyToken(token, env.JWT.SECRET_REFRESH);
