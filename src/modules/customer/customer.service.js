import Customer from "../../DB/models/customer.model.js";
import User from "../../DB/models/user.model.js";
import { MESSAGES } from "../../constants/messages.js";
import { deleteFromCloudinary } from "../../middlewares/upload.middleware.js";
import { verifyPassword } from "../../utils/hash.util.js";
import {
  createNotFoundError,
  createUnauthorizedError,
  createBadRequestError,
} from "../../errors/error.factory.js";

// ─── Helper: get user + customer and merge them ───────────────────────────────
const getFullProfile = async (userId) => {
  const user = await User.findById(userId)
    .select("-password -refreshTokens -__v")
    .exec();
  if (!user) throw createNotFoundError(MESSAGES.USER.NOT_FOUND);

  const customer = await Customer.findOne({ user: userId })
    .select("-__v -user")
    .exec();

  // merge user + customer into one clean object
  return {
    _id:       user._id,
    email:     user.email,
    roles:     user.roles,
    isActive:  user.isActive,
    createdAt: user.createdAt,
    // customer fields (fallback to empty if profile not created yet)
    fullName: customer?.fullName ?? user.fullName,
    phone:    customer?.phone    ?? "",
    bio:      customer?.bio      ?? "",
    avatar:   customer?.avatar   ?? { url: "", publicId: "" },
    location: customer?.location ?? { city: "", address: "" },
  };
};

// ============================================================
//                  CUSTOMER (SELF) SERVICES
// ============================================================

/**
 * @desc    Get my full profile (user + customer merged)
 */
export const getMe = async (userId) => {
  return await getFullProfile(userId);
};

// ------------------------------------------------------------

/**
 * @desc    Update my profile (upsert customer doc)
 * fields:  fullName, bio, phone, city, address
 */
export const updateMe = async (userId, data) => {
  const user = await User.findById(userId).exec();
  if (!user) throw createNotFoundError(MESSAGES.USER.NOT_FOUND);

  const { fullName, bio, phone, city, address } = data;

  // build update object
  const updateFields = {};
  if (fullName !== undefined) updateFields.fullName       = fullName;
  if (bio      !== undefined) updateFields.bio            = bio;
  if (phone    !== undefined) updateFields.phone          = phone;
  if (city     !== undefined) updateFields["location.city"]    = city;
  if (address  !== undefined) updateFields["location.address"] = address;

  // upsert — create customer doc if not exists
  await Customer.findOneAndUpdate(
    { user: userId },
    { $set: updateFields },
    { upsert: true, new: true }
  ).exec();

  return await getFullProfile(userId);
};

// ------------------------------------------------------------

/**
 * @desc    Upload / update avatar
 */
export const updateAvatar = async (userId, uploadedImage) => {
  const user = await User.findById(userId).exec();
  if (!user) throw createNotFoundError(MESSAGES.USER.NOT_FOUND);

  // get existing customer to delete old avatar
  const customer = await Customer.findOne({ user: userId }).exec();
  if (customer?.avatar?.publicId) {
    await deleteFromCloudinary(customer.avatar.publicId);
  }

  // upsert avatar
  await Customer.findOneAndUpdate(
    { user: userId },
    {
      $set: {
        "avatar.url":      uploadedImage.url,
        "avatar.publicId": uploadedImage.publicId,
      },
    },
    { upsert: true, new: true }
  ).exec();

  return await getFullProfile(userId);
};

// ------------------------------------------------------------

/**
 * @desc    Delete my account (user + customer)
 */
export const deleteMe = async (userId) => {
  const user = await User.findById(userId).exec();
  if (!user) throw createNotFoundError(MESSAGES.USER.NOT_FOUND);

  // delete avatar from Cloudinary
  const customer = await Customer.findOne({ user: userId }).exec();
  if (customer?.avatar?.publicId) {
    await deleteFromCloudinary(customer.avatar.publicId);
  }

  // delete both docs
  await Customer.findOneAndDelete({ user: userId }).exec();
  await user.deleteOne();
};

// ------------------------------------------------------------

/**
 * @desc    Change my password
 */
export const changeMyPassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).exec();
  if (!user) throw createNotFoundError(MESSAGES.USER.NOT_FOUND);

  const isValid = await verifyPassword(currentPassword, user.password);
  if (!isValid)
    throw createUnauthorizedError(MESSAGES.AUTH.INVALID_CURRENT_PASSWORD);

  const isSame = await verifyPassword(newPassword, user.password);
  if (isSame)
    throw createBadRequestError(MESSAGES.AUTH.SAME_PASSWORD);

  // model will hash automatically
  user.password = newPassword;
  // invalidate all sessions
  user.refreshTokens = [];
  await user.save();
};

// ============================================================
//                    ADMIN SERVICES
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
    .select("-password -refreshTokens -__v")
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
 * @desc    Admin — get user by id (merged profile)
 */
export const getUserById = async (userId) => {
  return await getFullProfile(userId);
};

// ------------------------------------------------------------

/**
 * @desc    Admin — delete any user + their customer profile
 */
export const deleteUser = async (userId) => {
  const user = await User.findById(userId).exec();
  if (!user) throw createNotFoundError(MESSAGES.USER.NOT_FOUND);

  const customer = await Customer.findOne({ user: userId }).exec();
  if (customer?.avatar?.publicId) {
    await deleteFromCloudinary(customer.avatar.publicId);
  }

  await Customer.findOneAndDelete({ user: userId }).exec();
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