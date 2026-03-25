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

const router = express.Router();

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  OrderController.stripeWebhook,
);

router.use(verifyAccessMW);

router.post(
  "/checkout",
  verifyPermissionsMW([ROLES.USER]),
  validateCheckout,
  OrderController.checkout,
);

router.patch(
  "/:orderId/cancel",
  verifyPermissionsMW([ROLES.USER]),
  validateOrderIdParam,
  OrderController.cancelMyOrder,
);

router.get(
  "/my-orders",
  verifyPermissionsMW([ROLES.USER]),
  OrderController.getMyOrders,
);

router.get(
  "/seller-orders",
  verifyPermissionsMW([ROLES.SELLER]),
  OrderController.getSellerOrders,
);

router.patch(
  "/:orderId/status",
  verifyPermissionsMW([ROLES.SELLER, ROLES.ADMIN]),
  validateOrderIdParam,
  validateUpdateStatus,
  OrderController.updateOrderStatus,
);

export default router;
