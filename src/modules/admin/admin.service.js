import User from "../../DB/models/user.model.js";
import { MESSAGES } from "../../constants/messages.js";
import { ROLES } from "../../constants/roles.js";
import { createNotFoundError } from "../../errors/error.factory.js";
import {
  guardProtectedRoles,
  safeUserData,
} from "../../helpers/user.helper.js";
import { parseQuery } from "../../utils/data.util.js";
import {
  getPagination,
  getPaginationMeta,
} from "../../utils/pagination.util.js";

// ============================================================
//                      ADMIN SERVICE
// ============================================================

/**
 * @desc    Get paginated list of users with optional filters
 * @param   {Object} decoded - current user decoded data {roles, userId}
 * @param   {Object} filters - {role, isActive, isDeleted, emailVerified, page, limit}
 * @returns {Object} users array + pagination meta
 */
export const getUsers = async ({ decoded, filters, page, limit }) => {
  // 1. build cleanFilter object from filters qurey params
  const cleanFilter = filters
    ? parseQuery(filters, ["roles", "isActive", "isDeleted", "emailVerified"])
    : {};

  // 2. Filter roles based on current user level
  if (cleanFilter.roles) {
    // make sure roles is array
    const rolesFilter = Array.isArray(cleanFilter.roles)
      ? cleanFilter.roles
      : [cleanFilter.roles];

    cleanFilter.roles = { $in: rolesFilter };

    // normal admins cannot see other admins or super_admin
    if (!decoded.roles.includes(ROLES.SUPER_ADMIN)) {
      cleanFilter.roles.$nin = [ROLES.ADMIN, ROLES.SUPER_ADMIN];
    }
  }

  // 2. get clean & safe pagination values
  const { pageNumber, safeLimit, skip } = getPagination(page, limit);

  // 3. fetch users and total count in parallel
  const [users, total] = await Promise.all([
    User.find(cleanFilter)
      .select(
        "-password -refreshTokens -emailVerificationToken -passwordResetToken"
      )
      .lean()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .exec(),
    User.countDocuments(cleanFilter),
  ]);

  // 4. return users with pagination meta
  return {
    users,
    pagination: getPaginationMeta(total, pageNumber, safeLimit),
  };
};

// ------------------------------------------------------------

/**
 * @desc    Get single user full detail by ID
 * @param   {Object} decoded - current user decoded data {roles, userId}
 * @param   {string} userId - Target user ID from route param
 * @returns {Object} user document (safe fields)
 */
export const getUserById = async (decoded, userId) => {
  // 1. find user by id
  const user = await User.findById(userId)
    .select(
      "-password -refreshTokens -emailVerificationToken -passwordResetToken"
    )
    .exec();

  // 2. throw if not found
  if (!user) throw createNotFoundError(MESSAGES.USER.NOT_FOUND);

  // 3. Guard protected roles based on who is calling
  guardProtectedRoles(decoded, user);

  // 4. return user data
  return safeUserData(user, true);
};

// ------------------------------------------------------------

/**
 * @desc    Change a user's role
 * @param   {Object} decoded - current user decoded data {roles, userId}
 * @param   {string} userId - Target user ID from route param
 * @param   {string} role   - New role to assign
 * @returns {Object} updated user document
 */
export const updateUserRole = async (decoded, userId, role) => {
  // 1. validate role is allowed
  if (!Object.values(ROLES).includes(role))
    throw createBadRequestError(MESSAGES.ADMIN.INVALID_ROLE);

  // 2. find user by id
  const user = await User.findById(userId).exec();
  if (!user) throw createNotFoundError(MESSAGES.USER.NOT_FOUND);

  // 3. Guard protected roles based on who is calling
  guardProtectedRoles(decoded, user);

  // 4. apply new role and save
  if (!user.roles.includes(role)) {
    user.roles.push(role);
    await user.save();
  }

  // 5. return updated user
  return user;
};

// ------------------------------------------------------------

/**
 * @desc    Toggle user isActive status (suspend / unsuspend)
 * @param   {Object} decoded - current user decoded data {roles, userId}
 * @param   {string} userId - Target user ID from route param
 * @returns {Object} updated user document
 */
export const toggleUserStatus = async (decoded, userId) => {
  // 1. find user by id
  const user = await User.findById(userId).exec();
  if (!user) throw createNotFoundError(MESSAGES.ADMIN.USER_NOT_FOUND);

  // 2. Guard protected roles based on who is calling
  guardProtectedRoles(decoded, user);

  // 3. toggle isActive and save
  user.isActive = !user.isActive;
  await user.save();

  // 4. return updated user
  return user;
};

// ------------------------------------------------------------
