import * as AdminService from "./admin.service.js";
import asyncHandler from "../../middlewares/asyncHandler.js";
import { MESSAGES } from "../../constants/messages.js";
import { successResponse } from "../../utils/apiResponse.util.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { createBadRequestError } from "../../errors/error.factory.js";

// ============================================================
//                      ADMIN CONTROLLER
// ============================================================

/**
 * @desc    Get paginated list of users with optional filters
 * @route   GET /api/admin/users
 * @access  Private - Admin
 */
export const getUsers = asyncHandler(async (req, res) => {
  // 1. extract pagination info and filters data
  const { page, limit, ...filters } = req.query;

  // 2. get current user decoded data
  const decoded = req.decoded;

  // 3. get users from service
  const { users, pagination } = await AdminService.getUsers({
    decoded,
    filters,
    page,
    limit,
  });

  // 4. return success response
  return res.json(
    successResponse({ users, pagination }, MESSAGES.USER.USERS_FETCHED)
  );
});

// ------------------------------------------------------------

/**
 * @desc    Get single user full detail by ID
 * @route   GET /api/admin/users/:userId
 * @access  Private - Admin
 */
export const getUserById = asyncHandler(async (req, res) => {
  // 1. extract user id from route param
  const { userId } = req.params;

  // 2. get current user decoded data
  const decoded = req.decoded;

  // 3. get user from service
  const user = await AdminService.getUserById(decoded, userId);

  // 4. return success response
  return res.json(successResponse({ user }, MESSAGES.USER.FETCHED));
});

// ------------------------------------------------------------

/**
 * @desc    Change a user's role
 * @route   PATCH /api/admin/users/:id/role
 * @access  Private - Admin
 */
export const updateUserRole = asyncHandler(async (req, res) => {
  // 1. validate role exists in body
  const { role } = req.body;
  if (!role) throw createBadRequestError(MESSAGES.VALIDATION.REQUIRED_FIELDS);

  // 2. extract user id from route param
  const { id } = req.params;

  // 3. get current user decoded data
  const decoded = req.decoded;

  // 4. update role from service
  const user = await AdminService.updateUserRole(decoded, id, role);

  // 5. return success response
  return res.json(successResponse({ user }, MESSAGES.ADMIN.ROLE_UPDATED));
});

// ------------------------------------------------------------

/**
 * @desc    Demote admin to seller (if exists) or customer
 * @route   PATCH /api/admin/users/:id/demote
 * @access  Private - Superadmin
 */
export const demoteAdmin = asyncHandler(async (req, res) => {
  // 1. extract user id from route param
  const { id } = req.params;

  // 2. get current user decoded data
  const decoded = req.decoded;

  // 3. demote admin from service
  const user = await AdminService.demoteAdmin(decoded, id);

  // 4. return success response
  return res.json(successResponse({ user }, MESSAGES.ADMIN.ROLE_UPDATED));
});

// ------------------------------------------------------------

/**
 * @desc    Toggle user isActive status (suspend / unsuspend)
 * @route   PATCH /api/admin/users/:id/status
 * @access  Private - Admin
 */
export const toggleUserStatus = asyncHandler(async (req, res) => {
  // 1. extract user id from route param
  const { id } = req.params;

  // 2. get current user decoded data
  const decoded = req.decoded;

  // 3. toggle status from service
  const user = await AdminService.toggleUserStatus(decoded, id);

  // 4. return success response
  return res.json(successResponse({ user }, MESSAGES.ADMIN.STATUS_UPDATED));
});

// ------------------------------------------------------------

/**
 * @desc    Manually mark a user's email as verified
 * @route   PATCH /api/admin/users/:id/verify-email
 * @access  Private - Admin
 */
export const verifyUserEmail = asyncHandler(async (req, res) => {
  // 1. extract user id from route param
  const { id } = req.params;

  // 2. get current user decoded data
  const decoded = req.decoded;

  // 3. verify email from service
  const user = await AdminService.verifyUserEmail(decoded, id);

  // 4. return success response
  return res.json(successResponse({ user }, MESSAGES.EMAIL.EMAIL_VERIFIED));
});

// ------------------------------------------------------------

/**
 * @desc    Soft delete a user account
 * @route   DELETE /api/admin/users/:id
 * @access  Private - Admin
 */
export const softDeleteUser = asyncHandler(async (req, res) => {
  // 1. extract user id from route param
  const { id } = req.params;

  // 2. get current user decoded data
  const decoded = req.decoded;

  // 3. soft delete user from service
  await AdminService.softDeleteUser(decoded, id);

  // 4. return no content
  return res.status(HTTP_STATUS.NO_CONTENT).end();
});

// ------------------------------------------------------------

/**
 * @desc    Revoke all refresh tokens for a user (force logout)
 * @route   DELETE /api/admin/users/:id/sessions
 * @access  Private - Admin
 */
export const revokeUserSessions = asyncHandler(async (req, res) => {
  // 1. extract user id from route param
  const { id } = req.params;

  // 2. get current user decoded data
  const decoded = req.decoded;

  // 3. revoke sessions from service
  await AdminService.revokeUserSessions(decoded, id);

  // 4. return no content
  return res.status(HTTP_STATUS.NO_CONTENT).end();
});

// ------------------------------------------------------------

/**
 * @desc    Get platform-wide stats
 * @route   GET /api/admin/stats
 * @access  Private - Admin
 */
export const getStats = asyncHandler(async (req, res) => {
  // 1. get stats from service
  const stats = await AdminService.getStats();

  // 2. return success response
  return res.json(successResponse({ stats }, MESSAGES.ADMIN.STATS_FETCHED));
});

// ------------------------------------------------------------
