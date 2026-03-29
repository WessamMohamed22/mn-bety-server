import mongoose from "mongoose";
import Order from "../../../DB/models/orderItem.model.js";
// import Cart from "../../../DB/models/cart.model.js";
import Product from "../../../DB/models/product.model.js";
import * as PaymentService from "./payment.service.js";
import * as CartService from "../../cart/cart.service.js";
import Seller from "../../../DB/models/saller.model.js";
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
    userId,
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
    userId,
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
  const order = await Order.findOne({ _id: orderId, userId });
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
  return await Order.find({ userId })
  .populate("items.product", "name images price discountPrice")
  .sort({ createdAt: -1 }).exec();
};

export const getSellerOrders = async (sellerId) => {
  return await Order.aggregate([
    // 1. Find orders that contain at least one item from this seller
    { $match: { "items.seller": new mongoose.Types.ObjectId(sellerId) } },
    
    // 2. Filter the items array so the seller ONLY sees their own products, not other sellers' products in the same order
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
    
    // 3. Populate the User data so the dashboard can show the Customer's Name!
    {
      $lookup: {
        from: "users", // The exact name of your users collection in MongoDB
        localField: "userId",
        foreignField: "_id",
        as: "user"
      }
    },
    
    // 4. Flatten the user array into a single object
    {
      $unwind: {
        path: "$user",
        preserveNullAndEmptyArrays: true 
      }
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



export const getSellerStatistics = async (userId) => {
  const seller = await Seller.findOne({ userId });
  if (!seller) return null;

  const sellerId = seller._id;

  // Get current month sales
  const currentDate = new Date();
  const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const currentMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  // Get previous month sales for comparison
  const previousMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
  const previousMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);

  const currentMonthStats = await Order.aggregate([
    {
      $match: {
        "items.seller": sellerId,
        orderStatus: { $in: ["shipped", "delivered"] },
        createdAt: { $gte: currentMonthStart, $lte: currentMonthEnd }
      }
    },
    { $unwind: "$items" },
    { $match: { "items.seller": sellerId } },
    {
      $group: {
        _id: null,
        totalEarnings: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
      }
    }
  ]);

  const previousMonthStats = await Order.aggregate([
    {
      $match: {
        "items.seller": sellerId,
        orderStatus: { $in: ["shipped", "delivered"] },
        createdAt: { $gte: previousMonthStart, $lte: previousMonthEnd }
      }
    },
    { $unwind: "$items" },
    { $match: { "items.seller": sellerId } },
    {
      $group: {
        _id: null,
        totalEarnings: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
      }
    }
  ]);

  // Calculate growth rate
  const currentEarnings = currentMonthStats[0]?.totalEarnings || 0;
  const previousEarnings = previousMonthStats[0]?.totalEarnings || 0;
  
  let growthRate = 0;
  if (previousEarnings > 0) {
    growthRate = ((currentEarnings - previousEarnings) / previousEarnings * 100).toFixed(2);
  } else if (currentEarnings > 0) {
    growthRate = 100; // 100% growth if previous was 0
  }

  const salesStats = await Order.aggregate([
    {
      $match: {
        "items.seller": sellerId,
        orderStatus: { $in: ["shipped", "delivered"] }
      }
    },
    { $unwind: "$items" },
    { $match: { "items.seller": sellerId } },
    {
      $group: {
        _id: null,
        totalEarnings: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
      }
    }
  ]);

  const newOrdersCount = await Order.countDocuments({
    "items.seller": sellerId,
    orderStatus: { $in: ["pending", "processing"] }
  });

  const activeProductsCount = await Product.countDocuments({
    seller: sellerId,
    isActive: true,
    isApproved: true
  });

  return {
    totalSales: salesStats[0]?.totalEarnings || 0,
    newOrders: newOrdersCount,
    activeProducts: activeProductsCount,
    growthRate: parseFloat(growthRate)
  };
};