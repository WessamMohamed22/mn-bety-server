import * as OrderService from "./services/order.service.js";
import * as PaymentService from "./services/payment.service.js";
import asyncHandler from "../../middlewares/asyncHandler.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import {
  successResponse,
  createdResponse,
} from "../../utils/apiResponse.util.js";
import Seller from "../../DB/models/saller.model.js";
import { createForbiddenError } from "../../errors/error.factory.js";
import { MESSAGES } from "../../constants/messages.js";

// Import our new Notification Service!
import * as NotificationService from "../notification/notification.service.js";

export const checkout = asyncHandler(async (req, res) => {
  const userId = req.decoded.userId;
  const { paymentMethod, shippingAddress } = req.body;

  if (paymentMethod === "COD") {
    const order = await OrderService.createCashOrder(userId, shippingAddress);
    return res
      .status(HTTP_STATUS.CREATED)
      .json(createdResponse({ order }, MESSAGES.order.placedSuccessfully));
  }

  if (paymentMethod === "Stripe") {
    const sessionUrl = await PaymentService.createStripeSession(
      userId,
      shippingAddress,
    );
    return res
      .status(HTTP_STATUS.OK)
      .json(
        successResponse({ url: sessionUrl }, MESSAGES.order.redirectingStripe),
      );
  }
});

export const stripeWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers["stripe-signature"];
  const rawBody = req.rawBody || req.body;

  const event = PaymentService.verifyWebhookSignature(rawBody, signature);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata.userId;
    const shippingAddress = JSON.parse(session.metadata.shippingAddress);

    // Extract the precise PaymentIntent ID from Stripe to save it
    const paymentIntentId = session.payment_intent;

    // Pass the paymentIntentId to the service
    await OrderService.createStripeOrder(
      userId,
      shippingAddress,
      paymentIntentId,
    );
  }

  return res.status(HTTP_STATUS.OK).json({ received: true });
});

export const cancelMyOrder = asyncHandler(async (req, res) => {
  const userId = req.decoded.userId;
  const { orderId } = req.params;

  // 1. Cancel the order in the database
  const order = await OrderService.cancelOrder(orderId, userId);

  //  Notify the seller(s)
  if (order.items && order.items.length > 0) {
    for (const item of order.items) {
      if (item.seller) {
        await NotificationService.createNotification({
          user: item.seller,
          title: "إلغاء طلب",
          message: `قام العميل بإلغاء الطلب رقم #${order._id.toString().slice(-6).toUpperCase()}`,
          relatedId: order._id,
          onModel: "Order",
          type: "order_cancelled"
        });
      }
    }
  }

  return res
    .status(HTTP_STATUS.OK)
    .json(successResponse({ order }, MESSAGES.order.cancelledSuccessfully));
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const userId = req.decoded.userId;
  const orders = await OrderService.getUserOrders(userId);
  return res
    .status(HTTP_STATUS.OK)
    .json(successResponse({ orders }, MESSAGES.order.fetchedSuccessfully));
});

export const getSellerOrders = asyncHandler(async (req, res) => {
  const userId = req.decoded.userId;
  const seller = await Seller.findOne({ userId });
  if (!seller) throw createForbiddenError(MESSAGES.order.sellerNotFound);

  const orders = await OrderService.getSellerOrders(seller._id);
  return res
    .status(HTTP_STATUS.OK)
    .json(
      successResponse(
        { orders },
        MESSAGES.order.sellerOrdersFetchedSuccessfully,
      ),
    );
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const newStatus = req.body.orderStatus || req.body.status;
  
  // 1. Update the order in the database
  const order = await OrderService.updateOrderStatus(orderId, newStatus);

  //  Notify the customer
  const customerId = order.userId || order.user; 
  if (customerId) {
    await NotificationService.createNotification({
      user: customerId,
      title: "تحديث حالة الطلب",
      message: `تم تحديث حالة طلبك رقم #${order._id.toString().slice(-6).toUpperCase()}`,
      relatedId: order._id,
      onModel: "Order",
      type: "order_status"
    });
  }

  return res
    .status(HTTP_STATUS.OK)
    .json(successResponse({ order }, MESSAGES.order.statusUpdatedSuccessfully));
});

export const getDashboardSummary = asyncHandler(async (req, res) => {
  const userId = req.decoded.userId;
  
  // Calling the renamed service function
  const statistics = await OrderService.getSellerStatistics(userId);
  
  return res
    .status(HTTP_STATUS.OK)
    .json(successResponse({ statistics }, "Dashboard statistics fetched successfully"));
});