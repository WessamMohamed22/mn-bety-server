import Seller from "../../DB/models/saller.model.js";
import User from "../../DB/models/user.model.js";
import { MESSAGES } from "../../constants/messages.js";
import { deleteFromCloudinary } from "../../middlewares/upload.middleware.js";
import {
  createNotFoundError,
  createConflictError,
  createForbiddenError,
} from "../../errors/error.factory.js";
import { ROLES } from "../../constants/roles.js";

// ============================================================
//                   SELLER (SELF) SERVICES
// ============================================================

/**
 * @desc    Get my seller profile
 */
export const getMySellerProfile = async (userId) => {
  const seller = await Seller.findOne({ user: userId })
    .populate("user", "fullName email createdAt")
    .exec();

  if (!seller) throw createNotFoundError(MESSAGES.SELLER.NOT_FOUND);
  return seller;
};

// ------------------------------------------------------------

/**
 * @desc    Create seller profile (called from auth.service on register)
 * @param   {string} userId
 */
export const createSellerProfile = async (userId) => {
  // check if already exists
  const existing = await Seller.findOne({ user: userId }).exec();
  if (existing) return existing;

  const seller = await Seller.create({ user: userId });
  return seller;
};

// ------------------------------------------------------------

/**
 * @desc    Update my seller profile (description, location, bankInfo)
 */
export const updateSellerProfile = async (userId, data) => {
  const seller = await Seller.findOne({ user: userId }).exec();
  if (!seller) throw createNotFoundError(MESSAGES.SELLER.NOT_FOUND);

  const { description, location, bankInfo } = data;

  if (description !== undefined) seller.description = description;

  if (location) {
    if (location.country !== undefined) seller.location.country = location.country;
    if (location.city    !== undefined) seller.location.city    = location.city;
    if (location.address !== undefined) seller.location.address = location.address;
  }

  if (bankInfo) {
    if (bankInfo.bankName      !== undefined) seller.bankInfo.bankName      = bankInfo.bankName;
    if (bankInfo.accountName   !== undefined) seller.bankInfo.accountName   = bankInfo.accountName;
    if (bankInfo.accountNumber !== undefined) seller.bankInfo.accountNumber = bankInfo.accountNumber;
    if (bankInfo.iban          !== undefined) seller.bankInfo.iban          = bankInfo.iban;
  }

  await seller.save();
  return seller.populate("user", "fullName email");
};

// ------------------------------------------------------------

/**
 * @desc    Upload / update seller logo
 */
export const updateSellerLogo = async (userId, uploadedImage) => {
  const seller = await Seller.findOne({ user: userId }).exec();
  if (!seller) throw createNotFoundError(MESSAGES.SELLER.NOT_FOUND);

  // delete old logo from Cloudinary
  if (seller.logo?.publicId) {
    await deleteFromCloudinary(seller.logo.publicId);
  }

  seller.logo = {
    url:      uploadedImage.url,
    publicId: uploadedImage.publicId,
  };

  await seller.save();
  return seller.populate("user", "fullName email");
};

// ============================================================
//                     ADMIN SERVICES
// ============================================================

/**
 * @desc    Admin — get all sellers with pagination
 */
export const getAllSellers = async ({ page = 1, limit = 10, search } = {}) => {
  const filter = {};

  const skip  = (page - 1) * limit;
  const total = await Seller.countDocuments(filter);

  // if search — find matching users first
  if (search) {
    const users = await User.find({
      fullName: { $regex: search, $options: "i" },
      roles: ROLES.SELLER,
    }).select("_id").exec();

    filter.user = { $in: users.map((u) => u._id) };
  }

  const sellers = await Seller.find(filter)
    .populate("user", "fullName email createdAt isActive")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .exec();

  return {
    sellers,
    total,
    page:  Number(page),
    pages: Math.ceil(total / limit),
  };
};

// ------------------------------------------------------------

/**
 * @desc    Admin — get seller by id
 */
export const getSellerById = async (sellerId) => {
  const seller = await Seller.findById(sellerId)
    .populate("user", "fullName email createdAt isActive")
    .exec();

  if (!seller) throw createNotFoundError(MESSAGES.SELLER.NOT_FOUND);
  return seller;
};

// ------------------------------------------------------------

/**
 * @desc    Admin — approve seller
 */
export const approveSeller = async (sellerId) => {
  const seller = await Seller.findById(sellerId).exec();
  if (!seller) throw createNotFoundError(MESSAGES.SELLER.NOT_FOUND);

  seller.isApproved = true;
  await seller.save();

  return { isApproved: seller.isApproved };
};

// ------------------------------------------------------------

/**
 * @desc    Admin — toggle seller isActive
 */
export const toggleSellerStatus = async (sellerId) => {
  const seller = await Seller.findById(sellerId).exec();
  if (!seller) throw createNotFoundError(MESSAGES.SELLER.NOT_FOUND);

  seller.isActive = !seller.isActive;
  await seller.save();

  return { isActive: seller.isActive };
};