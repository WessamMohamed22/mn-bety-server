import Seller from "../../DB/models/saller.model.js";
import User from "../../DB/models/user.model.js";
import { MESSAGES } from "../../constants/messages.js";
import { deleteFromCloudinary } from "../../middlewares/upload.middleware.js";
import { generateAccessToken } from "../../services/token.service.js";
import { ROLES } from "../../constants/roles.js";
import {
  createNotFoundError,
  createConflictError,
} from "../../errors/error.factory.js";

// ============================================================
//                   SELLER (SELF) SERVICES
// ============================================================

/**
 * @desc    Get my seller profile
 */
export const getMySellerProfile = async (userId) => {
  const seller = await Seller.findOne({ userId })
    .select("-__v")
    .exec();

  if (!seller) throw createNotFoundError(MESSAGES.SELLER.NOT_FOUND);
  return seller;
};

// ------------------------------------------------------------

/**
 * @desc    Create seller profile (called on register or upgrade)
 */
export const createSellerProfile = async (userId) => {
  const existing = await Seller.findOne({ userId }).exec();
  if (existing) return existing;

  const seller = await Seller.create({ userId });
  return seller;
};

// ------------------------------------------------------------

/**
 * @desc    Update my seller profile (description, location, bankInfo)
 */
export const updateSellerProfile = async (userId, data) => {
  const { description, location, bankInfo } = data;

  const updateFields = {};
  if (description !== undefined) updateFields.description = description;

  if (location) {
    if (location.country !== undefined) updateFields["location.country"] = location.country;
    if (location.city    !== undefined) updateFields["location.city"]    = location.city;
    if (location.address !== undefined) updateFields["location.address"] = location.address;
  }

  if (bankInfo) {
    if (bankInfo.bankName      !== undefined) updateFields["bankInfo.bankName"]      = bankInfo.bankName;
    if (bankInfo.accountName   !== undefined) updateFields["bankInfo.accountName"]   = bankInfo.accountName;
    if (bankInfo.accountNumber !== undefined) updateFields["bankInfo.accountNumber"] = bankInfo.accountNumber;
    if (bankInfo.iban          !== undefined) updateFields["bankInfo.iban"]          = bankInfo.iban;
  }

  const seller = await Seller.findOneAndUpdate(
    { userId },
    { $set: updateFields },
    { new: true, runValidators: true }
  )
    .select("-__v")
    .exec();

  if (!seller) throw createNotFoundError(MESSAGES.SELLER.NOT_FOUND);
  return seller;
};

// ------------------------------------------------------------

/**
 * @desc    Upload / update seller logo
 */
export const updateSellerLogo = async (userId, uploadedImage) => {
  const seller = await Seller.findOne({ userId }).exec();
  if (!seller) throw createNotFoundError(MESSAGES.SELLER.NOT_FOUND);

  // delete old logo from Cloudinary
  if (seller.logo?.publicId) {
    await deleteFromCloudinary(seller.logo.publicId);
  }

  const updated = await Seller.findOneAndUpdate(
    { userId },
    {
      $set: {
        "logo.url":      uploadedImage.url,
        "logo.publicId": uploadedImage.publicId,
      },
    },
    { new: true }
  )
    .select("-__v")
    .exec();

  return updated;
};

// ------------------------------------------------------------

/**
 * @desc    Upgrade customer to seller
 */
export const upgradeToSeller = async (userId, data) => {
  const user = await User.findById(userId).exec();
  if (!user) throw createNotFoundError(MESSAGES.USER.NOT_FOUND);

  // check if already a seller
  if (user.roles.includes(ROLES.SELLER))
    throw createConflictError("You already have a seller account.");

   const existingSeller = await Seller.findOne({ userId }).exec();
  // create seller profile
   let seller;
  if (existingSeller) {
    // restore existing seller profile
    existingSeller.isActive      = true;
    existingSeller.isApproved    = false;
    existingSeller.description   = data?.description ?? "";
    existingSeller.location      = data?.location    ?? {};
    existingSeller.bankInfo      = data?.bankInfo    ?? {};
    existingSeller.logo          = { url: "", publicId: "" };
    await existingSeller.save();
    seller = existingSeller;
  } else {
    // create new seller profile
    seller = await Seller.create({
      userId,
      description: data?.description ?? "",
      location:    data?.location    ?? {},
      bankInfo:    data?.bankInfo    ?? {},
    });
  }

  // add SELLER role to user
  user.roles.push(ROLES.SELLER);
  await user.save();

  // generate new access token with updated roles
  const accessToken = generateAccessToken({
    userId: user._id,
    roles:  user.roles,
  });

  return { seller, accessToken };
};

// ------------------------------------------------------------

/**
 * @desc    Seller soft delete their own account
 */
export const deleteSellerAccount = async (userId) => {
  // 1. find user
  const user = await User.findById(userId).exec();
  if (!user) throw createNotFoundError(MESSAGES.USER.NOT_FOUND);

  // 2. find seller
  const seller = await Seller.findOne({ userId }).exec();
  if (!seller) throw createNotFoundError(MESSAGES.SELLER.NOT_FOUND);

  // 3. delete logo from Cloudinary
  if (seller.logo?.publicId) {
    await deleteFromCloudinary(seller.logo.publicId);
  }

  // 4. anonymize seller profile
  await Seller.findOneAndUpdate(
    { userId },
    {
      $set: {
        isActive:        false,
        isApproved:      false,
        "logo.url":      "",
        "logo.publicId": "",
      },
      $unset: {
        description: "",
        location:    "",
        bankInfo:    "",
      },
    }
  );

  // 5. remove SELLER role from user — keep CUSTOMER
  user.roles         = user.roles.filter((r) => r !== ROLES.SELLER);
  user.refreshTokens = [];
  await user.save();

  // 6. generate new access token with updated roles
  const accessToken = generateAccessToken({
    userId: user._id,
    roles:  user.roles,
  });

  return { accessToken };
};
// ============================================================
//                    PUBLIC SERVICES
// ============================================================


/**
 * @desc    Public — Get all active sellers with Search
 */
export const getPublicSellers = async ({ page = 1, limit = 10, search } = {}) => {
  const skip = (page - 1) * limit;
    const filter = { isActive: true };
  if (search) {
    const users = await User.find({
      fullName: { $regex: search, $options: "i" }, 
      }).select("_id").exec();

    filter.userId = { $in: users.map((u) => u._id) };
  }

  const total = await Seller.countDocuments(filter);
  const sellers = await Seller.find(filter)
    .populate("userId", "fullName email") 
    .select("description location logo createdAt isApproved isActive rating") 
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .exec();

  return {
    sellers,
    total,
    page: Number(page),
    pages: Math.ceil(total / limit),
  };
};

/**
 * @desc    Public — Get single seller profile & info
 */
export const getPublicSellerProfile = async (sellerId) => {
  const seller = await Seller.findOne({ _id: sellerId, isActive: true })
    .populate("userId", "fullName")
    .select("description location logo")
    .exec();

  if (!seller) throw createNotFoundError(MESSAGES.SELLER.NOT_FOUND);
  return seller;
};

// ============================================================
//                     ADMIN SERVICES
// ============================================================

/**
 * @desc    Admin — get all sellers with pagination & search
 */
export const getAllSellers = async ({ page = 1, limit = 10, search } = {}) => {
  const filter = {};
  const skip   = (page - 1) * limit;

  if (search) {
    const users = await User.find({
      fullName: { $regex: search, $options: "i" },
      roles:    ROLES.SELLER,
    }).select("_id").exec();

    filter.userId = { $in: users.map((u) => u._id) };
  }

  const total = await Seller.countDocuments(filter);

  const sellers = await Seller.find(filter)
    .select("-__v")
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
    .select("-__v")
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

// ------------------------------------------------------------

/**
 * @desc    Admin — soft delete seller
 */
export const deleteSeller = async (sellerId) => {
  const seller = await Seller.findById(sellerId).exec();
  if (!seller) throw createNotFoundError(MESSAGES.SELLER.NOT_FOUND);

  // delete logo from Cloudinary
  if (seller.logo?.publicId) {
    await deleteFromCloudinary(seller.logo.publicId);
  }

  // soft delete + unset all profile data
  await Seller.findByIdAndUpdate(sellerId, {
    $set: {
      isActive:        false,
      isApproved:      false,
      "logo.url":      "",
      "logo.publicId": "",
    },
    $unset: {
      description: "",
      location:    "",
      bankInfo:    "",
    },
  });
};