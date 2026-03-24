import Customer from "../../../DB/models/customer.model.js";
import Seller from "../../../DB/models/saller.model.js";
import User from "../../../DB/models/user.model.js";
import { MESSAGES } from "../../../constants/messages.js";
import { createNotFoundError } from "../../../errors/error.factory.js";
import { safeUserData } from "../helpers/user.helper.js";

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
  return safeUserData(user);
};
// ------------------------------------------------------------

/**
 * @desc    Soft delete current authenticated user account with its profiles
 * @param   {string} userId - Decoded from access token
 * @returns {void}
 */
export const deleteAccount = async (userId) => {
  // 1. find user by id
  const user = await User.findById(userId).exec();
  if (!user) throw createNotFoundError(MESSAGES.AUTH.USER_NOT_FOUND);

  // 2. anonymize user personal data
  user.fullName = "Deleted User";
  user.email = `deleted_${userId}@deleted.com`;
  user.phone = null;
  user.isActive = false;
  user.refreshTokens = [];

  // 3. anonymize customer profile if exists
  await Customer.findOneAndUpdate(
    { userId },
    {
      $set: { "avatar.url": "", "avatar.publicId": "", bio: "" },
      $unset: { location: "" },
    }
  );

  // 4. anonymize seller profile if exists
  await Seller.findOneAndUpdate(
    { user: userId },
    {
      $set: { "logo.url": "", "logo.publicId": "", isActive: false },
      $unset: { description: "", location: "", bankInfo: "" },
    }
  );

  // 5. save user changes in DB
  await user.save();
};