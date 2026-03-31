import Customer from "../../DB/models/customer.model.js";
import Seller from "../../DB/models/saller.model.js";
import User from "../../DB/models/user.model.js";
import { MESSAGES } from "../../constants/messages.js";
import { ROLES } from "../../constants/roles.js";
import {
  createBadRequestError,
  createNotFoundError,
} from "../../errors/error.factory.js";
import {
  guardProtectedRoles,
  safeUserData,
} from "../../helpers/user.helper.js";
import { parseQuery } from "../../utils/data.util.js";
import { getStartOfMonth } from "../../utils/date.util.js";
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
  if (!user) throw createNotFoundError(MESSAGES.USER.NOT_FOUND);

  // 2. Guard protected roles based on who is calling
  guardProtectedRoles(decoded, user);

  // 3. toggle isActive and save
  user.isActive = !user.isActive;
  await user.save();

  // 4. return updated user
  return user;
};

// ------------------------------------------------------------

/**
 * @desc    Soft delete a user account
 * @param   {Object} decoded - current user decoded data {roles, userId}
 * @param   {string} userId - Target user ID from route param
 * @returns {void}
 */
export const verifyUserEmail = async (decoded, userId) => {
  // 1. find user by id
  const user = await User.findById(userId).exec();
  if (!user) throw createNotFoundError(MESSAGES.USER.NOT_FOUND);

  // 2. Guard protected roles based on who is calling
  guardProtectedRoles(decoded, user);

  // 2. throw if already verified
  if (user.emailVerified)
    throw createBadRequestError(MESSAGES.EMAIL.EMAIL_ALREADY_VERIFIED);

  // 3. mark email as verified and clear verification token
  user.emailVerified = true;
  user.emailVerificationToken = { token: null, expireAt: null };

  // 4. save changes in DB
  await user.save();

  // 5. return updated user
  return user;
};

// ------------------------------------------------------------

/**
 * @desc    Manually mark a user's email as verified
 * @param   {Object} decoded - current user decoded data {roles, userId}
 * @param   {string} userId - Target user ID from route param
 * @returns {Object} updated user document
 */
export const softDeleteUser = async (decoded, userId) => {
  // 1. find user by id
  const user = await User.findById(userId).exec();
  if (!user) throw createNotFoundError(MESSAGES.USER.NOT_FOUND);

  // 2. Guard protected roles based on who is calling
  guardProtectedRoles(decoded, user);

  // 3. throw if already deleted
  if (user.isDeleted)
    throw createBadRequestError(MESSAGES.USER.ALREADY_DELETED);

  // 4. soft delete — deactivate, clear sessions, set deleted flags
  user.fullName = "Deleted User";
  user.email = `deleted_${userId}@deleted.com`;
  user.isActive = false;
  user.isDeleted = true;
  user.deletedAt = new Date();
  user.refreshTokens = [];

  // 3. Disable associated profiles
  await Promise.all([
    Customer.findOneAndUpdate({ userId }, { isDeleted: true, isActive: false }),
    Seller.findOneAndUpdate({ userId }, { isDeleted: true, isActive: false }),
  ]);

  // 5. save changes in DB
  await user.save();
};

// ------------------------------------------------------------
/**
 * @desc    Revoke all refresh tokens for a user (force logout)
 * @param   {Object} decoded - current user decoded data {roles, userId}
 * @param   {string} userId - Target user ID from route param
 * @returns {void}
 */
export const revokeUserSessions = async (decoded, userId) => {
  // 1. find user by id
  const user = await User.findById(userId).exec();
  if (!user) throw createNotFoundError(MESSAGES.USER.NOT_FOUND);

  // 2. Guard protected roles based on who is calling
  guardProtectedRoles(decoded, user);

  if (user.isDeleted)
    throw createBadRequestError(MESSAGES.ADMIN.REVOKE_DELETED_USER_ERROR);

  // 3. clear all refresh tokens and save
  user.refreshTokens = [];
  await user.save();
};

// ------------------------------------------------------------

/**
 * @desc    Get platform-wide stats
 * @returns {Object} counts by status, role, and signups this month
 */
export const getStats = async () => {
  // 1. calculate start of current month
  const startOfMonth = getStartOfMonth();

  // 2. run all counts in parallel
  const [
    totalUsers,
    verifiedUsers,
    activeUsers,
    deletedUsers,
    newThisMonth,
    byRole,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ emailVerified: true }),
    User.countDocuments({ isActive: true, isDeleted: false }),
    User.countDocuments({ isDeleted: true }),
    User.countDocuments({ createdAt: { $gte: startOfMonth } }),
    User.aggregate([
      { $unwind: "$roles" },
      { $group: { _id: "$roles", count: { $sum: 1 } } },
    ]),
  ]);

  // 3. return formatted stats
  return {
    totalUsers,
    verifiedUsers,
    activeUsers,
    deletedUsers,
    newThisMonth,
    byRole: Object.fromEntries(byRole.map(({ _id, count }) => [_id, count])),
  };
};
// ------------------------------------------------------------
