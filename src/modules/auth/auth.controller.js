import * as AuthService from "./auth.service.js";
import asyncHandler from "../../middlewares/asyncHandler.js";
import { MESSAGES } from "../../constants/messages.js";
import { HEADERS } from "../../constants/headers.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import {
  getClearCookieConfig,
  getRefreshCookieConfig,
} from "../../config/cookie.config.js";
import {
  createdResponse,
  successResponse,
} from "../../utils/apiResponse.util.js";
import {
  createBadRequestError,
  createUnauthorizedError,
} from "../../errors/error.factory.js";

// ============================================================
//                      AUTH CONTROLLER
// ============================================================

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = asyncHandler(async (req, res) => {
  // 1. check for request body
  if (!req.body) createBadRequestError(MESSAGES.VALIDATION.REQUIRED_FIELDS);

  // 2. register user and get tokens service
  const { user, accessToken, refreshToken } = await AuthService.registerUser(
    req.body
  );

  // 3. set refresh token in secure Cookie
  res.cookie(HEADERS.REFRESH_TOKEN, refreshToken, getRefreshCookieConfig());

  // 4. return success sesponse with safe user data and access token
  return res
    .status(HTTP_STATUS.CREATED)
    .json(
      createdResponse({ user, accessToken }, MESSAGES.AUTH.REGISTER_SUCCESS)
    );
});
// ------------------------------------------------------------

/**
 * @desc    Login user and return access token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  // 1. check for request body
  if (!req.body) createBadRequestError(MESSAGES.VALIDATION.REQUIRED_FIELDS);
  const { email, password } = req.body;

  // 2. get current refresh token from cookie if exist
  const currentRefreshToken = req.cookies?.[HEADERS.REFRESH_TOKEN];

  // 3. login user service
  const { user, accessToken, refreshToken } = await AuthService.loginUser(
    email,
    password,
    currentRefreshToken
  );

  // 4. set refresh token in secure Cookie
  res.cookie(HEADERS.REFRESH_TOKEN, refreshToken, getRefreshCookieConfig());

  // 5. return success sesponse with safe user data and access token
  return res.json(
    successResponse({ user, accessToken }, MESSAGES.AUTH.LOGIN_SUCCESS)
  );
});

// ------------------------------------------------------------

/**
 * @desc    Logout user and invalidate token
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logout = asyncHandler(async (req, res) => {
  // 1. extract refresh token from cookie
  const refreshToken = req.cookies?.[HEADERS.REFRESH_TOKEN];

  // 2. clear cookie immediately
  res.clearCookie(HEADERS.REFRESH_TOKEN, getClearCookieConfig());
  // 3. remove token from DB if it exists
  if (refreshToken) await AuthService.logoutUser(refreshToken);
  // 4. return no content
  res.status(HTTP_STATUS.NO_CONTENT).end();
});

// ------------------------------------------------------------

/**
 * @desc    Refresh access token using refresh token
 * @route   POST /api/auth/refresh-token
 * @access  Public
 */
export const refreshToken = asyncHandler(async (req, res) => {
  // 1. check refresh token exists in cookie
  const currentRefreshToken = req.cookies?.[HEADERS.REFRESH_TOKEN];
  if (!currentRefreshToken)
    throw createUnauthorizedError(MESSAGES.AUTH.NO_TOKEN);

  // 2. clear old refresh token cookie
  res.clearCookie(HEADERS.REFRESH_TOKEN, getClearCookieConfig());

  // 3. rotate refresh token and get new access token
  const { accessToken, refreshToken } = await AuthService.refreshTokens(
    currentRefreshToken
  );

  // 4. set new refresh token in cookie:
  res.cookie(HEADERS.REFRESH_TOKEN, refreshToken, getRefreshCookieConfig());

  // 5. return new access token to client
  res.json(createdResponse(accessToken, MESSAGES.AUTH.TOKEN_REFRESHED));
});
// ------------------------------------------------------------

/**
 * @desc    Change password for authenticated user
 * @route   PATCH /api/auth/change-password
 * @access  Private
 */

export const changePassword = asyncHandler(async (req, res) => {
  // 1. validate current and new password in body
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword)
    throw createBadRequestError(MESSAGES.VALIDATION.REQUIRED_FIELDS);
  // 2. get refresh token if exists in cookie
  const refreshToken = req.cookies?.[HEADERS.REFRESH_TOKEN];
  // 3. change password service
  await AuthService.changePassword(
    req.decoded.userId,
    currentPassword,
    newPassword,
    refreshToken
  );
  // 4. clear refresh token cookie since all sessions are invalidated
  res.clearCookie(HEADERS.REFRESH_TOKEN, getClearCookieConfig());
  // 5. return success
  return res.json(successResponse(null, MESSAGES.AUTH.PASSWORD_CHANGED));
});
