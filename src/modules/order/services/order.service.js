import mongoose from "mongoose";
import Order from "../../../DB/models/orderItem.model.js";
import Cart from "../../../DB/models/cart.model.js";
import Product from "../../../DB/models/product.model.js";
import * as PaymentService from "./payment.service.js";
import {
  createBadRequestError,
  createNotFoundError,
} from "../../../errors/error.factory.js";
import { MESSAGES } from "../../../constants/messages.js";
export const getValidatedCart = async (userId) => {
  const cart = await Cart.findOne({ user: userId })
    .populate("items.product")
    .exec();

  if (!cart || cart.items.length === 0)
    throw createBadRequestError(MESSAGES.order.cartEmpty);

  let totalPrice = 0;
  const orderItems = [];

  for (const item of cart.items) {
    const product = item.product;
    if (!product) throw createNotFoundError(MESSAGES.order.productNotFound);
    if (product.stock < item.quantity) {
      throw createBadRequestError(
        MESSAGES.order.insufficientStock(product.stock, product.name),
      );
    }

    const itemPrice =
      product.discountPrice > 0 ? product.discountPrice : product.price;
    totalPrice += itemPrice * item.quantity;

    orderItems.push({
      product: product._id,
      seller: product.seller,
      name: product.name,
      price: itemPrice,
      quantity: item.quantity,
    });
  }

  return { cart, orderItems, totalPrice };
};

const finalizeOrder = async (order, cart) => {
  const bulkOptions = order.items.map((item) => ({
    updateOne: {
      filter: { _id: item.product },
      update: { $inc: { stock: -item.quantity } },
    },
  }));
  await Product.bulkWrite(bulkOptions);

  cart.items = [];
  await cart.save();
};

export const createCashOrder = async (userId, shippingAddress) => {
  const { cart, orderItems, totalPrice } = await getValidatedCart(userId);

  const order = await Order.create({
    user: userId,
    items: orderItems,
    totalPrice,
    paymentMethod: "COD",
    paymentStatus: "pending",
    shippingAddress,
  });

  await finalizeOrder(order, cart);
  return order;
};
export const createStripeOrder = async (
  userId,
  shippingAddress,
  stripePaymentIntentId,
) => {
  const { cart, orderItems, totalPrice } = await getValidatedCart(userId);

  const order = await Order.create({
    user: userId,
    items: orderItems,
    totalPrice,
    paymentMethod: "Stripe",
    paymentStatus: "completed",
    shippingAddress,
    stripePaymentIntentId, // Save the ID so we can refund it later!
  });

  await finalizeOrder(order, cart);
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