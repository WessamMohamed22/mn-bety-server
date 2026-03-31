import Customer from "../../DB/models/customer.model.js";
import User from "../../DB/models/user.model.js";
import { MESSAGES } from "../../constants/messages.js";
import { deleteFromCloudinary } from "../../middlewares/upload.middleware.js";
import { createNotFoundError } from "../../errors/error.factory.js";

// ============================================================
//                  CUSTOMER (SELF) SERVICES
// ============================================================

// get my profile
export const getMyProfile = async (userId) => {
  const customer = await Customer.findOne({ userId })
    .select("-__v")
    .exec();

  if (!customer) throw createNotFoundError(MESSAGES.USER.NOT_FOUND);

  // Normalise avatar for frontend: null if no image
  if (!customer.avatar?.url) {
    customer.avatar = null;
  }

  return customer;
};

// ------------------------------------------------------------

// update my profile (bio, city, address)
export const updateMyProfile = async (userId, data) => {
  const { bio, city, address } = data;

  const updateFields = {};
  if (bio     !== undefined) updateFields.bio                 = bio;
  if (city    !== undefined) updateFields["location.city"]    = city;
  if (address !== undefined) updateFields["location.address"] = address;

  const customer = await Customer.findOneAndUpdate(
    { userId },
    { $set: updateFields },
    { upsert: true, new: true, runValidators: true }
  )
    .select("-__v")
    .exec();

  return customer;
};

// ------------------------------------------------------------

// update my avatar
export const updateMyAvatar = async (userId, uploadedImage) => {
  const customer = await Customer.findOne({ userId }).exec();

  // delete old avatar from Cloudinary
  if (customer?.avatar?.publicId) {
    await deleteFromCloudinary(customer.avatar.publicId);
  }

  const updated = await Customer.findOneAndUpdate(
    { userId },
    {
      $set: {
        "avatar.url":      uploadedImage.url,
        "avatar.publicId": uploadedImage.publicId,
      },
    },
    { upsert: true, new: true }
  )
    .select("-__v")
    .exec();

  return updated;
};

// ------------------------------------------------------------

// delete my account (customer profile + user)
export const deleteMyCustomerAccount = async (userId) => {
  const customer = await Customer.findOne({ userId }).exec();

  if (customer?.avatar?.publicId) {
    await deleteFromCloudinary(customer.avatar.publicId);
  }

  await Customer.findOneAndDelete({ userId }).exec();
  await User.findByIdAndDelete(userId).exec();
};