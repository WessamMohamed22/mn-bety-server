import mongoose from "mongoose";
import User from "../../DB/models/user.model.js";
import { env } from "../../config/env.js";
import { MESSAGES } from "../../constants/messages.js";
import { ROLES } from "../../constants/roles.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../services/token.service.js";
import { createConflictError, createUnauthorizedError } from "../../errors/error.factory.js";
import { getExpiryDate } from "../../utils/date.util.js";
import { hashValue, verifyPassword } from "../../utils/hash.util.js";

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

/**
 * @desc    Validate credentials and generate tokens
 * @param   {string} email    - User email address
 * @param   {string} password - User plain text password
 * @returns {Object} user, accessToken, refreshToken
 */
export const loginUser = async (email, password, currentRefreshToken) => {
  // 1. check if user exists
  const user = await User.findOne({ email }).exec();
  if (!user) throw createUnauthorizedError(MESSAGES.AUTH.LOGIN_FAILED);
  // 2. validate password
  const validPwd = await verifyPassword(password, user.password);
  if (!validPwd) throw createUnauthorizedError(MESSAGES.AUTH.LOGIN_FAILED);

  // 3. clean up expire tokens first !!!!!
  user.refreshTokens = user.refreshTokens.filter(
    (rt) => rt.expireAt > new Date()
  );

  // 4. handle existing refresh token cookie
  if (currentRefreshToken) {
    // hash token to find it
    const currentHashedToken = hashValue(currentRefreshToken);
    const tokenInDB = user.refreshTokens.find(
      (rt) => rt.token === currentHashedToken
    );
    // if cookie exists but not in DB => token was already rotated
    // else so its old token => remove it + clean up any expired tokens
    if (!tokenInDB) {
      user.refreshTokens = [];
    } else {
      user.refreshTokens = user.refreshTokens.filter(
        (rt) => rt.token !== currentHashedToken
      );
    }
  }

  // 5. generate access and refresh token
  const accessToken = generateAccessToken({
    userId: user._id,
    roles: user.roles,
  });
  const refreshToken = generateRefreshToken({ userId: user._id });

  // 6. hash new refresh token and store it
  const hashedToken = hashValue(refreshToken);
  user.refreshTokens.push({
    token: hashedToken,
    expireAt: getExpiryDate(env.JWT.REFRESH_EXPIRE),
  });

  // 7. update last login & save changes in DB
  user.lastLogin = new Date();
  await user.save();

  // 8. return safe user data + tokens
  return {
    user: { userId: user._id, fullName: user.fullName, roles: user.roles },
    accessToken,
    refreshToken,
  };
};
