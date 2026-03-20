import * as CartService from "./cart.service.js";
import asyncHandler from "../../middlewares/asyncHandler.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { successResponse } from "../../utils/apiResponse.util.js";

export const getUserCart = asyncHandler(async (req, res) => {
  const userId = req.decoded.id;
  const cart = await CartService.getUserCart(userId);
  return res
    .status(HTTP_STATUS.OK)
    .json(successResponse({ cart }, "Cart fetched successfully"));
});

export const addToCart = asyncHandler(async (req, res) => {
  const userId = req.decoded.userId;
  const { productId, quantity } = req.body;

  const cart = await CartService.addToCart(userId, productId, quantity);

  return res
    .status(HTTP_STATUS.OK)
    .json(successResponse({ cart }, "Product added to cart"));
});

export const updateCartItemQuantity = asyncHandler(async (req, res) => {
  const userId = req.decoded.userId;
  const { productId } = req.params; // ID from the URL
  const { quantity } = req.body; // New quantity from the body

  const cart = await CartService.updateCartItemQuantity(
    userId,
    productId,
    quantity,
  );

  return res
    .status(HTTP_STATUS.OK)
    .json(successResponse({ cart }, "Cart quantity updated successfully"));
});

export const removeFromCart = asyncHandler(async (req, res) => {
  const userId = req.decoded.userId;
  const { productId } = req.params;

  const cart = await CartService.removeFromCart(userId, productId);

  return res
    .status(HTTP_STATUS.OK)
    .json(successResponse({ cart }, "Product removed from cart"));
});

export const clearCart = asyncHandler(async (req, res) => {
  const userId = req.decoded.userId;
  const clearedCart = await CartService.clearCart(userId);
  return res.status(HTTP_STATUS.OK).json({
    status: "Success",
    message: "Cart has been cleared successfully",
    data: clearedCart
  });
});