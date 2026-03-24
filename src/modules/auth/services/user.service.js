import User from "../../../DB/models/user.model.js";
import { MESSAGES } from "../../../constants/messages.js";
import { createNotFoundError } from "../../../errors/error.factory.js";

// ============================================================
//                      USER SERVICE
// ============================================================

/**
 * @desc    Get current authenticated user data
 * @param   {string} userId - Decoded from access token
 * @returns {Object} safe user data
 */
export const getMe = async (userId) => {
  // 1. find user by id
  const user = await User.findById(userId).exec();
  if (!user) throw createNotFoundError(MESSAGES.AUTH.USER_NOT_FOUND);

  // 2. return safe user data
  const { _id, fullName, email, phone, roles } = user;
  return { userId: _id, fullName, email, phone, roles };
};

// ------------------------------------------------------------

/**
 * @desc    Update current authenticated user info
 * @param   {string} userId   - Decoded from access token
 * @param   {Object} userData - Fields to update
 * @returns {Object} updated safe user data
 */
export const updateMe = async (userId, userData) => {
  // 1. find user by id
  const user = await User.findById(userId).exec();
  if (!user) throw createNotFoundError(MESSAGES.AUTH.USER_NOT_FOUND);

  // 2. apply updates (only allowed fields)
  const { fullName, phone } = userData;
  if (fullName) user.fullName = fullName;
  if (phone) user.phone = phone;

  // 3. save changes in DB
  await user.save();

  // 4. return safe updated user data
  const { _id, roles, email } = user;
  return {
    userId: _id,
    fullName: user.fullName,
    email,
    phone: user.phone,
    roles,
  };
};
