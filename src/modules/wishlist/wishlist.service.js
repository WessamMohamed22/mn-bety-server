import Wishlist from "../../DB/models/wishlist.model.js";
import Product from "../../DB/models/product.model.js";
import { MESSAGES } from "../../constants/messages.js";
import {
  createNotFoundError,
  createConflictError,
  createBadRequestError,
} from "../../errors/error.factory.js";

/**
 * @desc    Get user's wishlist
 * @param   {string} userId
 */
export const getWishlist = async (userId) => {
  const wishlist = await Wishlist.findOne({ user: userId })
    .populate({
      path: "products",
      select: "name price discountPrice images slug rating isActive isApproved",
    })
    .exec();

  return wishlist || { user: userId, products: [] };
};

/**
 * @desc    Add product to wishlist
 * @param   {string} userId
 * @param   {string} productId
 */
export const addToWishlist = async (userId, productId) => {
  // 1. check product exists and is active + approved
  const product = await Product.findById(productId).exec();
  if (!product) throw createNotFoundError(MESSAGES.PRODUCT.NOT_FOUND);
  if (!product.isActive || !product.isApproved)
    throw createBadRequestError(MESSAGES.PRODUCT.NOT_FOUND);

  // 2. find or create wishlist
  let wishlist = await Wishlist.findOne({ user: userId }).exec();
  if (!wishlist) {
    wishlist = await Wishlist.create({ user: userId, products: [productId] });
    return wishlist;
  }

  // 3. check if product already in wishlist
  const alreadyExists = wishlist.products.some(
    (p) => p.toString() === productId.toString()
  );
  if (alreadyExists) throw createConflictError(MESSAGES.WISHLIST.ALREADY_EXISTS);

  // 4. add product & save
  wishlist.products.push(productId);
  await wishlist.save();
  return wishlist;
};

/**
 * @desc    Remove product from wishlist
 * @param   {string} userId
 * @param   {string} productId
 */
export const removeFromWishlist = async (userId, productId) => {
  const wishlist = await Wishlist.findOne({ user: userId }).exec();
  if (!wishlist) throw createNotFoundError(MESSAGES.WISHLIST.NOT_FOUND);

  const exists = wishlist.products.some(
    (p) => p.toString() === productId.toString()
  );
  if (!exists) throw createNotFoundError(MESSAGES.WISHLIST.ITEM_NOT_FOUND);

  wishlist.products = wishlist.products.filter(
    (p) => p.toString() !== productId.toString()
  );

  await wishlist.save();
  return wishlist;
};

/**
 * @desc    Clear entire wishlist
 * @param   {string} userId
 */
export const clearWishlist = async (userId) => {
  const wishlist = await Wishlist.findOne({ user: userId }).exec();
  if (!wishlist) throw createNotFoundError(MESSAGES.WISHLIST.NOT_FOUND);

  wishlist.products = [];
  await wishlist.save();
  return wishlist;
};

/**
 * @desc    Check if product is in wishlist
 * @param   {string} userId
 * @param   {string} productId
 */
export const isProductInWishlist = async (userId, productId) => {
  const wishlist = await Wishlist.findOne({ user: userId }).exec();
  if (!wishlist) return { isInWishlist: false };

  const isInWishlist = wishlist.products.some(
    (p) => p.toString() === productId.toString()
  );

  return { isInWishlist };
};