import { createForbiddenError } from "../errors/error.factory";
import { MESSAGES } from "../constants/messages";

// Guards route access based on allowed roles
export const verifyPermissionsMW = (allowedRoles) => async (req, res, next) => {
  // 1. check if roles exist
  let roles = req.decoded?.roles;
  if (!roles) throw createForbiddenError(MESSAGES.AUTH.NO_PERMISSION);
  // 2. check if user has permissions
  const hasPermission = roles.some((role) => allowedRoles.includes(role));
  if (!hasPermission) throw createForbiddenError(MESSAGES.AUTH.NO_PERMISSION);
  next();
};
