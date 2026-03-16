import * as CartService from "./cart.service.js";
import asyncHandler from "../../middlewares/asynHandler.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { successResponse } from "../../utils/apiResponse.util.js";

export const getUserCart = asyncHandler(async(req , res)=>{
    const userId = req.decoded.id;
    const cart = await CartService.getUserCart(userId);
    return res
        .status(HTTP_STATUS.OK)
        .json(successResponse({ cart }, "Cart fetched successfully"));
})

export const addToCart = asyncHandler(async (req, res) => {
  const userId = req.decoded.userId;
  const { productId, quantity } = req.body;

  const cart = await CartService.addToCart(userId, productId, quantity);

  return res
    .status(HTTP_STATUS.OK)
    .json(successResponse({ cart }, "Product added to cart"));
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
  await CartService.clearCart(userId);

  return res.status(HTTP_STATUS.NO_CONTENT).end();
});