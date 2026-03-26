import asyncHandler from "./asyncHandler.js";
import User from "../DB/models/user.model.js";
import { HEADERS } from "../constants/headers.js";
import { MESSAGES } from "../constants/messages.js";
import { createUnauthorizedError } from "../errors/error.factory.js";
import { verifyAccessToken } from "../services/token.service.js";

// Verifies JWT access token & attaches decoded payload to req.user
export const verifyAccessMW = asyncHandler(async (req, res, next) => {
  // 1. get accessToken & and check if exist
  const authHeader = req.headers?.[HEADERS.AUTHORIZATION];
  const accessToken = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : req.cookies?.[HEADERS.ACCESS_TOKEN];

  // 2. Attach decoded payload to request
  if (!accessToken) throw createUnauthorizedError(MESSAGES.AUTH.NO_TOKEN);

  // 3. store decoded data in request:
  req.decoded = verifyAccessToken(accessToken);
  if (!req.decoded?.userId)
    throw createUnauthorizedError(MESSAGES.AUTH.INVALID_TOKEN);

  // 4. fetch user and attach to request
  req.user = await User.findById(req.decoded.userId)
    .select("emailVerified roles passwordChangedAt")
    .exec();

  if (!req.user) throw createUnauthorizedError(MESSAGES.AUTH.INVALID_TOKEN);

  // 5. check if password changed after token was issued
  if (req.user.changedPasswordAfter(req.decoded.iat))
    throw createUnauthorizedError(MESSAGES.AUTH.INVALID_TOKEN);

  next();
});
