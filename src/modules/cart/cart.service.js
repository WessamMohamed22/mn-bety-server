import redisClient from "../../config/redis.js";
import Product from "../../DB/models/product.model.js";
import { MESSAGES } from "../../constants/messages.js";
import {
  createBadRequestError,
  createNotFoundError,
} from "../../errors/error.factory.js";

// Cart will expire in 7 days (in seconds)
const CART_TTL = 7 * 24 * 60 * 60; 

// Helper: Get cart key
const getCartKey = (userId) => `cart:${userId}`;

const isValidQuantity = (quantity) =>
  Number.isInteger(quantity) && quantity > 0;

const parseCartItemsSafely = (cartData) => {
  const parsed = JSON.parse(cartData);
  if (!Array.isArray(parsed)) return [];
  return parsed;
};

/**
 * @desc    Get user's cart (with Dynamic Stock Validation)
 * @param   {string} userId
 */
export const getUserCart = async (userId) => {
  const key = getCartKey(userId);
  const cartData = await redisClient.get(key);
  
  if (!cartData) return { userId, items: [] };

  let parsedCart;
  try {
    parsedCart = parseCartItemsSafely(cartData); // Array of { productId, quantity }
  } catch {
    await redisClient.del(key);
    return { userId, items: [] };
  }

  if (parsedCart.length === 0) return { userId, items: [] };

  const productIds = parsedCart.map(item => item.productId);

  // Fetch live products from MongoDB to check current stock & prices
  const liveProducts = await Product.find({ _id: { $in: productIds } })
    .select("name price discountPrice images slug stock seller isActive")
    .exec();

  const liveProductsMap = new Map(
    liveProducts.map((product) => [product._id.toString(), product])
  );

  const validItems = [];
  let cartModified = false;

  for (const item of parsedCart) {
    const product = liveProductsMap.get(item.productId);
    
    // If product was deleted, deactivated, or stock is 0, we drop it (cartModified = true)
    if (!product || !product.isActive || product.stock === 0) {
      cartModified = true;
      continue; 
    }

    // If user wants 5 but only 2 are left, reduce their cart quantity
    let finalQuantity = item.quantity;
    if (finalQuantity > product.stock) {
      finalQuantity = product.stock;
      cartModified = true;
    }

    validItems.push({
      product: product, // Send populated product to frontend
      quantity: finalQuantity
    });
  }

  // If we had to remove/reduce items because of stock, update Redis silently
  if (cartModified) {
    const updatedRedisItems = validItems.map(item => ({
      productId: item.product._id.toString(),
      quantity: item.quantity
    }));
    await redisClient.setEx(key, CART_TTL, JSON.stringify(updatedRedisItems));
  }

  return { userId, items: validItems };
};

/**
 * @desc    Add product to cart or increase quantity
 * @param   {string} userId
 * @param   {string} productId
 * @param   {number} quantity
 */
export const addToCart = async (userId, productId, quantity = 1) => {
  if (!isValidQuantity(quantity)) {
    throw createBadRequestError("Quantity must be a positive integer.");
  }

  // 1. Check MongoDB for stock first
  const product = await Product.findById(productId).exec();
  if (!product) throw createNotFoundError(MESSAGES.PRODUCT.NOT_FOUND);
  if (quantity > product.stock)
    throw createBadRequestError(MESSAGES.CART.OUT_OF_STOCK(product.stock));

  const key = getCartKey(userId);
  const cartData = await redisClient.get(key);
  let items = [];
  if (cartData) {
    try {
      items = parseCartItemsSafely(cartData);
    } catch {
      await redisClient.del(key);
      items = [];
    }
  }

  // 2. Check if item already in Redis cart
  const existingItemIndex = items.findIndex(item => item.productId === productId.toString());

  if (existingItemIndex > -1) {
    const newQuantity = items[existingItemIndex].quantity + quantity;
    if (newQuantity > product.stock) {
      throw createBadRequestError(MESSAGES.CART.OUT_OF_STOCK(product.stock));
    }
    items[existingItemIndex].quantity = newQuantity;
  } else {
    items.push({ productId: productId.toString(), quantity });
  }

  // 3. Save to Redis with 7-day expiration
  await redisClient.setEx(key, CART_TTL, JSON.stringify(items));

  // Return the fully populated cart using our read function
  return await getUserCart(userId);
};

/**
 * @desc    Update cart item quantity directly
 */
export const updateCartItemQuantity = async (userId, productId, quantity) => {
  if (!isValidQuantity(quantity)) {
    throw createBadRequestError("Quantity must be a positive integer.");
  }

  const product = await Product.findById(productId).exec();
  if (!product) throw createNotFoundError(MESSAGES.PRODUCT.NOT_FOUND);
  if (quantity > product.stock)
    throw createBadRequestError(MESSAGES.CART.OUT_OF_STOCK(product.stock));

  const key = getCartKey(userId);
  const cartData = await redisClient.get(key);
  if (!cartData) throw createNotFoundError(MESSAGES.CART.NOT_FOUND);

  let items;
  try {
    items = parseCartItemsSafely(cartData);
  } catch {
    await redisClient.del(key);
    throw createNotFoundError(MESSAGES.CART.NOT_FOUND);
  }

  const itemIndex = items.findIndex(item => item.productId === productId.toString());
  
  if (itemIndex === -1) throw createNotFoundError("Item not found in cart");

  items[itemIndex].quantity = quantity;
  await redisClient.setEx(key, CART_TTL, JSON.stringify(items));

  return await getUserCart(userId);
};

/**
 * @desc    Remove an item from the cart
 */
export const removeFromCart = async (userId, productId) => {
  const key = getCartKey(userId);
  const cartData = await redisClient.get(key);
  if (!cartData) return await getUserCart(userId);

  let items;
  try {
    items = parseCartItemsSafely(cartData);
  } catch {
    await redisClient.del(key);
    return { userId, items: [] };
  }

  items = items.filter(item => item.productId !== productId.toString());

  if (items.length === 0) {
    await redisClient.del(key);
  } else {
    await redisClient.setEx(key, CART_TTL, JSON.stringify(items));
  }
  return await getUserCart(userId);
};

/**
 * @desc    Clear entire cart (e.g., after successful checkout)
 */
export const clearCart = async (userId) => {
  await redisClient.del(getCartKey(userId));
  return { userId, items: [] };
};