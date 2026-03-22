import User from "../../DB/models/user.model.js";
import { MESSAGES } from "../../constants/messages.js";
import { deleteFromCloudinary } from "../../middlewares/upload.middleware.js";
import { verifyPassword } from "../../utils/hash.util.js";
import {
  createNotFoundError,
  createUnauthorizedError,
  createBadRequestError,
} from "../../errors/error.factory.js";

// ─── Safe user fields to return to client ────────────────────────────────────
const safeFields = "-password -refreshTokens -__v";

// ============================================================
//                    USER (SELF) SERVICES
// ============================================================

/**
 * @desc    Get my profile
 */
export const getMe = async (userId) => {
  const user = await User.findById(userId)
    .select(safeFields)
    .exec();

  if (!user) throw createNotFoundError(MESSAGES.USER.NOT_FOUND);
  return user;
};

// ------------------------------------------------------------

/**
 * @desc    Update my profile (fullName, bio, phone, location)
 */
export const updateMe = async (userId, data) => {
  const user = await User.findById(userId).exec();
  if (!user) throw createNotFoundError(MESSAGES.USER.NOT_FOUND);

  const { fullName, bio, phone, city, address } = data;

  if (fullName !== undefined) user.fullName        = fullName;
  if (bio      !== undefined) user.bio             = bio;
  if (phone    !== undefined) user.phone           = phone;
  if (city     !== undefined) user.location.city   = city;
  if (address  !== undefined) user.location.address = address;

  await user.save();

  const { password, refreshTokens, __v, ...safeUser } = user.toObject();
  return safeUser;
};

// ------------------------------------------------------------

/**
 * @desc    Upload / update avatar
 */
export const updateAvatar = async (userId, uploadedImage) => {
  const user = await User.findById(userId).exec();
  if (!user) throw createNotFoundError(MESSAGES.USER.NOT_FOUND);

  // delete old avatar from Cloudinary
  if (user.avatar?.publicId) {
    await deleteFromCloudinary(user.avatar.publicId);
  }

  user.avatar = {
    url:      uploadedImage.url,
    publicId: uploadedImage.publicId,
  };

  await user.save();

  const { password, refreshTokens, __v, ...safeUser } = user.toObject();
  return safeUser;
};

// ------------------------------------------------------------

/**
 * @desc    Delete my account
 */
export const deleteMe = async (userId) => {
  const user = await User.findById(userId).exec();
  if (!user) throw createNotFoundError(MESSAGES.USER.NOT_FOUND);

  // delete avatar from Cloudinary
  if (user.avatar?.publicId) {
    await deleteFromCloudinary(user.avatar.publicId);
  }

  await user.deleteOne();
};

// ------------------------------------------------------------

/**
 * @desc    Change my password
 */
export const changeMyPassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).exec();
  if (!user) throw createNotFoundError(MESSAGES.USER.NOT_FOUND);

  // verify current password
  const isValid = await verifyPassword(currentPassword, user.password);
  if (!isValid)
    throw createUnauthorizedError(MESSAGES.AUTH.INVALID_CURRENT_PASSWORD);

  // new password must be different
  const isSame = await verifyPassword(newPassword, user.password);
  if (isSame)
    throw createBadRequestError(MESSAGES.AUTH.SAME_PASSWORD);

  // update — model will hash it automatically
  user.password = newPassword;

  // invalidate all refresh tokens (force re-login on all devices)
  user.refreshTokens = [];

  await user.save();
};

// ============================================================
//                     ADMIN SERVICES
// ============================================================

/**
 * @desc    Admin — get all users with pagination & search
 */
export const getAllUsers = async ({ page = 1, limit = 10, search } = {}) => {
  const filter = {};

  if (search) {
    filter.$or = [
      { fullName: { $regex: search, $options: "i" } },
      { email:    { $regex: search, $options: "i" } },
    ];
  }

  const skip  = (page - 1) * limit;
  const total = await User.countDocuments(filter);

  const users = await User.find(filter)
    .select(safeFields)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .exec();

  return {
    users,
    total,
    page:  Number(page),
    pages: Math.ceil(total / limit),
  };
};

// ------------------------------------------------------------

/**
 * @desc    Admin — get user by id
 */
export const getUserById = async (userId) => {
  const user = await User.findById(userId)
    .select(safeFields)
    .exec();

  if (!user) throw createNotFoundError(MESSAGES.USER.NOT_FOUND);
  return user;
};

// ------------------------------------------------------------

/**
 * @desc    Admin — delete any user
 */
export const deleteUser = async (userId) => {
  const user = await User.findById(userId).exec();
  if (!user) throw createNotFoundError(MESSAGES.USER.NOT_FOUND);

  if (user.avatar?.publicId) {
    await deleteFromCloudinary(user.avatar.publicId);
  }

  await user.deleteOne();
};

// ------------------------------------------------------------

/**
 * @desc    Admin — toggle user isActive
 */
export const toggleUserStatus = async (userId) => {
  const user = await User.findById(userId).exec();
  if (!user) throw createNotFoundError(MESSAGES.USER.NOT_FOUND);

  user.isActive = !user.isActive;
  await user.save();

  return { isActive: user.isActive };
};