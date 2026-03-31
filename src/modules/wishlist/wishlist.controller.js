import * as WishlistService from "./wishlist.service.js";
import asyncHandler from "../../middlewares/asyncHandler.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { successResponse, createdResponse } from "../../utils/apiResponse.util.js";
import { MESSAGES } from "../../constants/messages.js";

/**
 * @desc    Get user's wishlist
 * @route   GET /api/wishlist
 * @access  Private (User)
 */
export const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await WishlistService.getWishlist(req.decoded.userId);
  return res
    .status(HTTP_STATUS.OK)
    .json(successResponse({ wishlist }, MESSAGES.WISHLIST.FETCHED));
});

/**
 * @desc    Add product to wishlist
 * @route   POST /api/wishlist
 * @access  Private (User)
 */
export const addToWishlist = asyncHandler(async (req, res) => {
  const wishlist = await WishlistService.addToWishlist(
    req.decoded.userId,
    req.body.productId
  );
  return res
    .status(HTTP_STATUS.CREATED)
    .json(createdResponse({ wishlist }, MESSAGES.WISHLIST.ITEM_ADDED));
});

/**
 * @desc    Remove product from wishlist
 * @route   DELETE /api/wishlist/:productId
 * @access  Private (User)
 */
export const removeFromWishlist = asyncHandler(async (req, res) => {
  const wishlist = await WishlistService.removeFromWishlist(
    req.decoded.userId,
    req.params.productId
  );
  return res
    .status(HTTP_STATUS.OK)
    .json(successResponse({ wishlist }, MESSAGES.WISHLIST.ITEM_REMOVED));
});

/**
 * @desc    Clear wishlist
 * @route   DELETE /api/wishlist
 * @access  Private (User)
 */
export const clearWishlist = asyncHandler(async (req, res) => {
  await WishlistService.clearWishlist(req.decoded.userId);
  return res
    .status(HTTP_STATUS.OK)
    .json(successResponse(null, MESSAGES.WISHLIST.CLEARED));
});

/**
 * @desc    Check if product is in wishlist
 * @route   GET /api/wishlist/:productId
 * @access  Private (User)
 */
export const checkProductInWishlist = asyncHandler(async (req, res) => {
  const result = await WishlistService.isProductInWishlist(
    req.decoded.userId,
    req.params.productId
  );
  return res
    .status(HTTP_STATUS.OK)
    .json(successResponse(result, MESSAGES.WISHLIST.FETCHED));
});