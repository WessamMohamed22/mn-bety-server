import Stripe from "stripe";
import User from "../../../DB/models/user.model.js";
import { env } from "../../../config/env.js";
import { createBadRequestError, createNotFoundError } from "../../../errors/error.factory.js";
import * as OrderService from "./order.service.js";

const stripe = new Stripe(env.STRIPE.SECRET_KEY);

export const createStripeSession = async (userId, shippingAddress) => {
  const { orderItems } = await OrderService.getValidatedCart(userId);
  
  const user = await User.findById(userId);
  if (!user) throw createNotFoundError("User not found");

  const line_items = orderItems.map((item) => ({
    price_data: {
      currency: "egp",
      product_data: { name: item.name },
      unit_amount: item.price * 100, 
    },
    quantity: item.quantity,
  }));

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items,
    success_url: `${env.CLIENT_URL}/user/cart/order-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.CLIENT_URL}/cart?canceled=true`,
    customer_email: user.email,
    metadata: {
      userId: userId.toString(),
      shippingAddress: JSON.stringify(shippingAddress),
    },
  });

  return session.url;
};

export const verifyWebhookSignature = (rawBody, signature) => {
  try {
    return stripe.webhooks.constructEvent(
      rawBody,
      signature,
      env.STRIPE.WEBHOOK_SECRET
    );
  } catch (err) {
    throw createBadRequestError(`Webhook Verification Failed: ${err.message}`);
  }
};

export const refundStripePayment = async (paymentIntentId) => {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
    });
    return refund;
  } catch (error) {
    throw createBadRequestError(`Stripe Refund Failed: ${error.message}`);
  }
};