import mongoose from "mongoose";
import User from "../../DB/models/user.model.js";
import { env } from "../../config/env.js";
import { MESSAGES } from "../../constants/messages.js";
import { ROLES } from "../../constants/roles.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../services/token.service.js";
import { createConflictError } from "../../errors/error.factory.js";
import { getExpiryDate } from "../../utils/date.util.js";
import { hashValue } from "../../utils/hash.util.js";

// ============================================================
//                      AUTH SERVICE
// ============================================================

/**
 * @desc    Register a new user, generate and store tokens
 * @param   {Object} userData - Raw user data from request body
 * @returns {Object} user, accessToken, refreshToken
 */

export const registerUser = async (userData) => {
  // 1. check if email already used
  const existUser = await User.findOne({ email: userData.email }).exec();
  if (existUser) throw createConflictError(MESSAGES.USER.EMAIL_ALREADY_EXISTS);

  // 2. create object_id for user
  const userId = new mongoose.Types.ObjectId();

  // 3. generate access and refresh token
  const accessToken = generateAccessToken({
    userId: userId,
    roles: ROLES.USER,
  });
  const refreshToken = generateRefreshToken({ userId });

  // 4. hash new refresh token with expireAt in array
  const hashedToken = hashValue(refreshToken);
  const refreshTokens = [
    { token: hashedToken, expireAt: getExpiryDate(env.JWT.REFRESH_EXPIRE) },
  ];
  // 5. create & save user in DB
  const user = await User.create({ _id: userId, ...userData, refreshTokens });

  // 6. return safe user data + tokens
  return {
    user: { userId: user._id, fullName: user.fullName, roles: user.roles },
    accessToken,
    refreshToken,
  };
};

// ------------------------------------------------------------
