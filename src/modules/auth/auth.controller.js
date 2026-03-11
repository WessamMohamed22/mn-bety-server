import * as AuthService from "./auth.service.js";
import asyncHandler from "../../middlewares/asynHandler.js";
import { MESSAGES } from "../../constants/messages.js";
import { HEADERS } from "../../constants/headers.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { getRefreshCookieConfig } from "../../config/cookie.config.js";
import { createdResponse } from "../../utils/apiResponse.util.js";
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
  if (!req.body) createBadRequestError(MESSAGES.VALIDATION.REQUIRED_FIELDS);
  const { user, accessToken, refreshToken } = await AuthService.registerUser(
    req.body
  );

  // set refresh token in secure httpOnly cookie
  res.cookie(HEADERS.REFRESH_TOKEN, refreshToken, getRefreshCookieConfig());
  return res
    .status(HTTP_STATUS.CREATED)
    .json(
      createdResponse({ user, accessToken }, MESSAGES.AUTH.REGISTER_SUCCESS)
    );
});
// ------------------------------------------------------------
