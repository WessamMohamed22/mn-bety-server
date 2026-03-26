import { MESSAGES } from "../constants/messages.js";
import { createForbiddenError } from "../errors/error.factory.js";

export const requireVerifiedEmailMW = (req, res, next) => {
  // 1. check if user email is verified
  if (!req.user.emailVerified)
    throw createForbiddenError(MESSAGES.EMAIL.EMAIL_NOT_VERIFIED);

  // 2. email is verified — proceed
  next();
};
