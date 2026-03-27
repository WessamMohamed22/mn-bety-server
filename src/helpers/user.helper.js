import { MESSAGES } from "../constants/messages.js";
import { ROLES } from "../constants/roles.js";
import { createForbiddenError } from "../errors/error.factory.js";

// ============================================================
//                      USER HELPERS
// ============================================================

/**
 * @desc    Strip sensitive fields and return safe user data
 * @param   {Object} user - Mongoose user document
 * @param   {boolean} isAdmin - Indicates whether the requester is an admin.
 * @returns {Object} safe user data
 */
export const safeUserData = (user, isAdmin = false) => {
  // 1. Extract the base safe fields
  const base = {
    userId: user._id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    roles: user.roles,
    emailVerified: user.emailVerified,
  };

  // 2. Check if the requester is an admin
  // If true: include additional management-related fields
  if (isAdmin) {
    return {
      ...base,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      isActive: user.isActive,
    };
  }

  return base;
};

// ------------------------------------------------------------

/**
 * @desc    Guard — prevent actions on admin or superadmin accounts
 * @param   {Object} targetUser - User document from DB
 * @returns {void} throws if target is protected
 */
export const guardProtectedRoles = (targetUser) => {
  // 1. check if target user has a protected role
  const protectedRoles = [ROLES.ADMIN, ROLES.SUPER_ADMIN];
  const isProtected = targetUser.roles.some((r) => protectedRoles.includes(r));

  // 2. throw if protected
  if (isProtected) throw createForbiddenError(MESSAGES.ADMIN.FORBIDDEN_TARGET);
};
