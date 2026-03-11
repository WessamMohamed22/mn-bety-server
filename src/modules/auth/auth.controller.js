import * as AuthService from "./auth.service.js";
import asyncHandler from "../../middlewares/asynHandler.js";
import { MESSAGES } from "../../constants/messages.js";
import { HEADERS } from "../../constants/headers.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { getRefreshCookieConfig } from "../../config/cookie.config.js";
import { createdResponse, successResponse } from "../../utils/apiResponse.util.js";
import { createBadRequestError } from "../../errors/error.factory.js";

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
