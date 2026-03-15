import mongoose from "mongoose";
import User from "../../DB/models/user.model.js";
import { env } from "../../config/env.js";
import { MESSAGES } from "../../constants/messages.js";
import { ROLES } from "../../constants/roles.js";
import {
  decodeToken,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../services/token.service.js";
import {
  createConflictError,
  createUnauthorizedError,
  createBadRequestError, 
} from "../../errors/error.factory.js";
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
  const { role, ...baseData } = userData;

  // 1. check if email already used
  const emailExist = await User.findOne({ email: userData.email }).exec();
  if (emailExist) throw createConflictError(MESSAGES.USER.EMAIL_ALREADY_EXISTS);

  // 2. validate role
  const allowedRoles = [ROLES.USER, ROLES.SELLER];
  if (!allowedRoles.includes(role))
    throw createBadRequestError(MESSAGES.USER.INVALID_ROLE);

  // 3. create object_id for user
  const userId = new mongoose.Types.ObjectId();

  // 4. build roles array based on role
  const roles =
    role === ROLES.SELLER ? [ROLES.SELLER] : [ROLES.USER, ROLES.SELLER];

  // 5. generate access and refresh token
  const accessToken = generateAccessToken({
    userId: userId,
    roles: roles,
  });
  const refreshToken = generateRefreshToken({ userId });

  // 6. hash new refresh token with expireAt in array
  const hashedToken = hashValue(refreshToken);
  const refreshTokens = [
    { token: hashedToken, expireAt: getExpiryDate(env.JWT.REFRESH_EXPIRE) },
  ];
  // 7. create & save user in DB
  const user = await User.create({
    _id: userId,
    ...baseData,
    roles,
    refreshTokens,
  });

  // 8. return safe user data + tokens
  return {
    user: { userId: user._id, fullName: user.fullName, roles },
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

// ------------------------------------------------------------

/**
 * @desc    Invalidate refresh token on logout
 * @param   {string} refreshToken - Token stored in httpOnly cookie
 * @returns {void}
 */
export const logoutUser = async (refreshToken) => {
  // 1. decode refreshToken
  const decoded = decodeToken(refreshToken);
  if (!decoded || !decoded.userId) return;
  // 2. check if user exist
  const user = await User.findById(decoded.userId).exec();
  if (!user) return;
  // 3. hash token & detect token reused
  const hashedToken = hashValue(refreshToken);
  const tokenInDB = user.refreshTokens.find((rt) => rt.token === hashedToken);
  if (!tokenInDB) {
    // user has been hacked - wipe all
    user.refreshTokens = [];
  } else {
    // just remove token from user
    user.refreshTokens = user.refreshTokens.filter(
      (rt) => rt.token !== hashedToken
    );
  }
  // 4. save changes inDB
  await user.save();
};

// ------------------------------------------------------------

/**
 * @desc    Verify refresh token and issue new access token
 * @param   {string} refreshToken - Token stored in httpOnly cookie
 * @returns {Object} accessToken
 */
export const refreshTokens = async (currentRefreshToken) => {
  // 1. hash current refreshToken
  const hashedToken = hashValue(currentRefreshToken);
  // 2. find user who owns this token
  const user = await User.findOne({
    "refreshTokens.token": hashedToken,
  }).exec();

  // 2. if no user => detect token reused
  if (!user) {
    // extract userId with decodeing without verifying
    const hackedDecoded = decodeToken(currentRefreshToken);

    // check if user exist => remove all token as may be hacked
    if (hackedDecoded?.userId) {
      await User.updateOne(
        { _id: hackedDecoded.userId },
        { $set: { refreshTokens: [] } }
      );
    }
    // if decoded failed then its invalid
    throw createUnauthorizedError(MESSAGES.AUTH.INVALID_TOKEN);
  }
  console.log(env.JWT.REFRESH_EXPIRE);
  // 3. verify token - it already handled error
  verifyRefreshToken(currentRefreshToken);

  // 4. generate new access & refresh tokens
  const accessToken = generateAccessToken({
    userId: user._id,
    roles: user.roles,
  });
  const refreshToken = generateRefreshToken({ userId: user._id });

  // 5. remove used token + clean up expired tokens
  user.refreshTokens = user.refreshTokens.filter(
    (rt) => rt.token !== hashedToken && rt.expireAt > new Date()
  );
  // 6. hash new token and add it with expire date & save
  const hashedNewToken = hashValue(refreshToken);
  user.refreshTokens.push({
    token: hashedNewToken,
    expireAt: getExpiryDate(env.JWT.REFRESH_EXPIRE),
  });
  await user.save();

  // 7. return tokens to controllers
  return { accessToken, refreshToken };
};
