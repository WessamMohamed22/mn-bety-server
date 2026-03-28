import express from "express";
import * as OrderController from "./order.controller.js";
import {
  validateCheckout,
  validateOrderIdParam,
  validateUpdateStatus,
} from "./order.validation.js";
import { verifyAccessMW } from "../../middlewares/verifyAccessMW.js";
import { verifyPermissionsMW } from "../../middlewares/verifyPermissionsMW.js";
import { ROLES } from "../../constants/roles.js";
import { requireVerifiedEmailMW } from "../../middlewares/requireVerifiedEmailMW.js";

const router = express.Router();

// 1. Stripe Webhook (Must be Public)
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  OrderController.stripeWebhook
);

// 2. Global Authentication & Verification for all order routes below
router.use(verifyAccessMW);
router.use(requireVerifiedEmailMW);

// 3. Customer Routes
router.post(
  "/checkout",
  verifyPermissionsMW([ROLES.CUSTOMER]),
  validateCheckout,
  OrderController.checkout
);

router.patch(
  "/:orderId/cancel",
  verifyPermissionsMW([ROLES.CUSTOMER]),
  validateOrderIdParam,
  OrderController.cancelMyOrder
);

router.get(
  "/my-orders",
  verifyPermissionsMW([ROLES.CUSTOMER]),
  OrderController.getMyOrders
);

// 4. Seller & Admin Routes
router.get(
  "/seller-orders",
  verifyPermissionsMW([ROLES.SELLER]),
  OrderController.getSellerOrders
);

router.patch(
  "/:orderId/status",
  verifyPermissionsMW([ROLES.SELLER, ROLES.ADMIN]),
  validateOrderIdParam,
  validateUpdateStatus,
  OrderController.updateOrderStatus
);

export default router;