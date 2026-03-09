import { env } from "../config/env.js";
import crypto from "crypto";
import bcrypt from "bcrypt";

// --- Password (bcrypt) ---
// hash password for secure save in DB
export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(env.BCRYPT_SALT_ROUNDS);
  return await bcrypt.hash(password, salt);
};
// verify password
export const verifyPassword = async (password, hashpassword) => {
  return await bcrypt.compare(password, hashpassword);
};

// --- hashing (crypto) ---
// Hash any string value using sha256
export const hashValue = (value) => {
  return crypto.createHash("sha256").update(value).digest("hex");
};
