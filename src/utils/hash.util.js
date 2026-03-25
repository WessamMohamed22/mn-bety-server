/**
 * @file hash.js
 * @description Cryptographic utilities:
 * - password hashing (bcrypt)
 * - token generation & hashing (crypto)
 */

import { env } from "../config/env.js";
import crypto from "crypto";
import bcrypt from "bcrypt";

// --- Password (bcrypt) -----------------------------------------------

/**
 * Hashes a plain-text password using bcrypt.
 * @param {string} password - plain-text password
 * @returns {Promise<string>} hashed password
 */
export const hashPassword = async (password) => {
  // 1. Generate salt using configured rounds
  const salt = await bcrypt.genSalt(env.BCRYPT_SALT_ROUNDS);
  // 2. Hash password with generated salt
  return await bcrypt.hash(password, salt);
};

/**
 * Compares a plain-text password against a bcrypt hash.
 * @param {string} password - plain-text password
 * @param {string} hashedPassword - stored bcrypt hash
 * @returns {Promise<boolean>} true if match, false otherwise
 */
export const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// --- Hashing (crypto) ------------------------------------------------

/**
 * Hashes any string value using SHA-256.
 * @param {string} value - value to hash
 * @returns {string} hex-encoded SHA-256 hash
 */
export const hashValue = (value) => {
  return crypto.createHash("sha256").update(value).digest("hex");
};

/**
 * Generates a secure random token and its SHA-256 hash.
 * - raw token  : sent to user (email link / response)
 * - hashed     : stored in DB for later comparison
 * @param {number} bytes - token size in bytes (default: 32)
 * @returns {{ token: string, hashed: string }}
 */
export const generateHashedToken = (bytes = 32) => {
  // 1. Generate cryptographically secure random token
  const token = crypto.randomBytes(bytes).toString("hex");
  // 2. Hash token for safe storage in DB
  const hashed = hashValue(token);
  return { token, hashed };
};