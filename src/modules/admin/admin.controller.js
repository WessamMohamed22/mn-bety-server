import * as AdminService from "./admin.service.js";
import asyncHandler from "../../middlewares/asyncHandler.js";
import { MESSAGES } from "../../constants/messages.js";
import { successResponse } from "../../utils/apiResponse.util.js";

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

  // 2. get users from service
  const { users, pagination } = await AdminService.getUsers({
    filters,
    page,
    limit,
  });

  // 3. return success response
  return res.json(
    successResponse({ users, pagination }, MESSAGES.ADMIN.USERS_FETCHED)
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

  // 2. get user from service
  const user = await AdminService.getUserById(userId);

  // 3. return success response
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

  // 3. update role from service
  const user = await AdminService.updateUserRole(id, role);

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

  // 2. toggle status from service
  const user = await AdminService.toggleUserStatus(id);

  // 3. return success response
  return res.json(successResponse({ user }, MESSAGES.ADMIN.STATUS_UPDATED));
});

// ------------------------------------------------------------
// ------------------------------------------------------------
// ------------------------------------------------------------
// ------------------------------------------------------------
// ------------------------------------------------------------
// ------------------------------------------------------------
// ------------------------------------------------------------
// ------------------------------------------------------------
// ------------------------------------------------------------
// ------------------------------------------------------------
