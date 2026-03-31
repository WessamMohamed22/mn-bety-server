import { createForbiddenError } from "../errors/error.factory.js";
import { MESSAGES } from "../constants/messages.js";

// Guards route access based on allowed roles
export const verifyPermissionsMW = (allowedRoles) => async (req, res, next) => {
  // 1. check if roles exist
  let roles = req.decoded?.roles;
  if (!roles) throw createForbiddenError(MESSAGES.AUTH.NO_PERMISSION);
  // 2. check if user has permissions
  const hasPermission = roles.some((role) =>
    allowedRoles.map(r => r.toLowerCase()).includes(role.toLowerCase())
  );
  if (!hasPermission) throw createForbiddenError(MESSAGES.AUTH.NO_PERMISSION);
  next();
};