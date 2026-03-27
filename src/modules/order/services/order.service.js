import mongoose from "mongoose";
import Order from "../../../DB/models/orderItem.model.js";
// import Cart from "../../../DB/models/cart.model.js";
import Product from "../../../DB/models/product.model.js";
import * as PaymentService from "./payment.service.js";
import * as CartService from "../../cart/cart.service.js";
import {
  createBadRequestError,
  createNotFoundError,
} from "../../../errors/error.factory.js";
import { MESSAGES } from "../../../constants/messages.js";

export const getValidatedCart = async (userId) => {
  // 1. Read from Redis instead of MongoDB!
  const cart = await CartService.getUserCart(userId);
  
  if (!cart || cart.items.length === 0) throw createBadRequestError(MESSAGES.order.cartEmpty);

  let totalPrice = 0;
  const orderItems = [];

  for (const item of cart.items) {
    const product = item.product; // Already populated dynamically by our Redis service!
    if (!product) throw createNotFoundError(MESSAGES.order.productNotFound);
    
    // (Optional) Extra safety check, though Redis service already checks stock
    if (product.stock < item.quantity) {
      throw createBadRequestError(MESSAGES.order.insufficientStock(product.stock, product.name));
    }

    const itemPrice = product.discountPrice > 0 ? product.discountPrice : product.price;
    totalPrice += itemPrice * item.quantity;

    orderItems.push({
      product: product._id,
      seller: product.seller,
      name: product.name,
      price: itemPrice,
      quantity: item.quantity,
    });
  }

  return { userId, orderItems, totalPrice };
};

const finalizeOrder = async (order, userId) => {
  const bulkOptions = order.items.map((item) => ({
    updateOne: {
      filter: { _id: item.product },
      update: { $inc: { stock: -item.quantity } },
    },
  }));
  await Product.bulkWrite(bulkOptions);

  // Clear Redis cart after successful order
  await CartService.clearCart(userId);
};

export const createCashOrder = async (userId, shippingAddress) => {
  const { orderItems, totalPrice } = await getValidatedCart(userId);

  const order = await Order.create({
    user: userId,
    items: orderItems,
    totalPrice,
    paymentMethod: "COD",
    paymentStatus: "pending",
    shippingAddress,
  });

  await finalizeOrder(order, userId);
  return order;
};
export const createStripeOrder = async (
  userId,
  shippingAddress,
  stripePaymentIntentId,
) => {
  const { orderItems, totalPrice } = await getValidatedCart(userId);

  const order = await Order.create({
    user: userId,
    items: orderItems,
    totalPrice,
    paymentMethod: "Stripe",
    paymentStatus: "completed",
    shippingAddress,
    stripePaymentIntentId, // Save the ID so we can refund it later!
  });

  await finalizeOrder(order, userId);
  return order;
};

export const cancelOrder = async (orderId, userId) => {
  const order = await Order.findOne({ _id: orderId, user: userId });
  if (!order) throw createNotFoundError(MESSAGES.order.notFound);

  // Only allow cancellation if it hasn't shipped yet
  if (order.orderStatus !== "pending" && order.orderStatus !== "processing") {
    throw createBadRequestError(
      MESSAGES.order.alreadyProcessed(order.orderStatus),
    );
  }

  // 1. Restore the Stock (increment back what we decremented)
  const bulkOptions = order.items.map((item) => ({
    updateOne: {
      filter: { _id: item.product },
      update: { $inc: { stock: item.quantity } },
    },
  }));
  await Product.bulkWrite(bulkOptions);

  // 2. Handle Stripe Refund (If applicable)
  if (
    order.paymentMethod === "Stripe" &&
    order.paymentStatus === "completed" &&
    order.stripePaymentIntentId
  ) {
    await PaymentService.refundStripePayment(order.stripePaymentIntentId);
    order.paymentStatus = "refunded";
  }
  // 3. Update Order Status
  order.orderStatus = "cancelled";
  await order.save();

  return order;
};

export const getUserOrders = async (userId) => {
  return await Order.find({ user: userId }).sort({ createdAt: -1 });
};

export const getSellerOrders = async (sellerId) => {
  return await Order.aggregate([
    { $match: { "items.seller": new mongoose.Types.ObjectId(sellerId) } },
    {
      $addFields: {
        items: {
          $filter: {
            input: "$items",
            as: "item",
            cond: {
              $eq: ["$$item.seller", new mongoose.Types.ObjectId(sellerId)],
            },
          },
        },
      },
    },
    { $sort: { createdAt: -1 } },
  ]);
};

export const updateOrderStatus = async (orderId, status) => {
  const order = await Order.findById(orderId);
  if (!order) throw createNotFoundError(MESSAGES.order.notFound);

  order.orderStatus = status;
  await order.save();
  return order;
};