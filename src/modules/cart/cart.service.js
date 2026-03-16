import Cart from "../../DB/models/cart.model.js";
import Product from "../../DB/models/product.model.js";
import { MESSAGES } from "../../constants/messages.js";
import {
  createBadRequestError,
  createNotFoundError,
} from "../../errors/error.factory.js";

/**
 * @desc    Get user's cart
 * @param   {string} userId
 */
export const getUserCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId }).populate({
    path: "items.product",
    select: "name price discountPrice images slug stock seller",
  });
  return cart || { user: userId, items: [] };
};

/**
 * @desc    Add product to cart or increase quantity
 * @param   {string} userId
 * @param   {string} productId
 * @param   {number} quantity
 */
export const addToCart = async (userId, productId, quantity = 1) => {
  const product = await Product.findById(productId);
  if (!product) {
    throw createNotFoundError(MESSAGES.PRODUCT_NOT_FOUND);
  }
  if (quantity > product.stock) {
    throw createBadRequestError(`Only ${product.stock} items left in stock`);
  }
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({
      user: userId,
      items: [{ product: productId, quantity }],
    });
    return cart;
  }
  const productIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId.toString(),
  );

  if (productIndex > -1) {
    const newQuantity = cart.items[productIndex].quantity + quantity;
    if (product.stock < newQuantity) {
      throw createBadRequestError(
        `Cannot add more. Stock limit: ${product.stock}`,
      );
    }
    cart.items[productIndex].quantity = newQuantity;
  } else {
    cart.items.push({ product: productId, quantity });
  }
  await cart.save();
  return cart;
};

/**
 * @desc    Update the exact quantity of an item in the cart
 * @param   {string} userId
 * @param   {string} productId
 * @param   {number} quantity - The exact new quantity
 */
export const updateCartItemQuantity = async (userId, productId, quantity) => {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) throw createNotFoundError("Cart not found");
  const productIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId.toString(),
  );
  if (productIndex === -1) {
    throw createNotFoundError("Product is not in the cart");
  }
  const product = await Product.findById(productId);
  if (product.stock < quantity) {
    throw createBadRequestError(`Only ${product.stock} items left in stock`);
  }
  cart.items[productIndex].quantity = quantity;
  await cart.save();
  return cart;
};

/**
 * @desc    Remove an item from the cart
 * @param   {string} userId
 * @param   {string} productId
 */
export const removeFromCart = async (userId, productId) => {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) throw createNotFoundError("Cart not found");

  cart.items = cart.items.filter(
    (item) => item.product.toString() !== productId.toString(),
  );

  await cart.save();
  return cart;
};

/**
 * @desc    Empty the entire cart
 * @param   {string} userId
 */
export const clearCart = async (userId) => {
  const cart = await Cart.findOne({ user: userId });
  if (cart) {
    cart.items = [];
    await cart.save();
  }
  return { message: "Cart cleared successfully" };
};