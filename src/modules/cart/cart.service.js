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
  const cart = await Cart.findOne({ userId }).populate({
    path: "items.product",
    select: "name price discountPrice images slug stock seller",
  }).exec();
  return cart || { userId, items: [] };
};

/**
 * @desc    Add product to cart or increase quantity
 * @param   {string} userId
 * @param   {string} productId
 * @param   {number} quantity
 */
export const addToCart = async (userId, productId, quantity = 1) => {
  const product = await Product.findById(productId).exec();
  if (!product) throw createNotFoundError(MESSAGES.PRODUCT.NOT_FOUND);
  if (quantity > product.stock)
    throw createBadRequestError(MESSAGES.CART.OUT_OF_STOCK(product.stock));

  let cart = await Cart.findOne({ userId }).exec();
  if (!cart) {
    cart = await Cart.create({ userId, items: [{ product: productId, quantity }] });
    return cart;
  }

  const productIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId.toString()
  );

  if (productIndex > -1) {
    const newQuantity = cart.items[productIndex].quantity + quantity;
    if (product.stock < newQuantity)
      throw createBadRequestError(MESSAGES.CART.STOCK_LIMIT(product.stock));
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
  const cart = await Cart.findOne({ user: userId }).exec();
  if (!cart) throw createNotFoundError(MESSAGES.CART.NOT_FOUND);

  const productIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId.toString()
  );
  if (productIndex === -1) throw createNotFoundError(MESSAGES.CART.ITEM_NOT_FOUND);

  const product = await Product.findById(productId).exec();
  if (!product) throw createNotFoundError(MESSAGES.PRODUCT.NOT_FOUND);
  if (product.stock < quantity)
    throw createBadRequestError(MESSAGES.CART.OUT_OF_STOCK(product.stock));

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
  const cart = await Cart.findOne({ userId }).exec();
  if (!cart) throw createNotFoundError(MESSAGES.CART.NOT_FOUND);

  cart.items = cart.items.filter(
    (item) => item.product.toString() !== productId.toString()
  );

  await cart.save();
  return cart;
};

/**
 * @desc    Empty the entire cart
 * @param   {string} userId
 */
export const clearCart = async (userId) => {
  const cart = await Cart.findOne({ userId }).exec();
  if (!cart) throw createNotFoundError(MESSAGES.CART.NOT_FOUND);
  cart.items = [];
  await cart.save();
  return cart;
};