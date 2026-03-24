import express from "express";
import {
  createReview,
  getProductReviews,
  getReviewById,
  updateReview,
  deleteReview,
} from "./review.controller.js";
import {
  validateCreateReview,
  validateUpdateReview,
  validateMongoIdParam,
  validatePagination,
} from "./review.validation.js";
import { verifyAccessMW }      from "../../middlewares/verifyAccessMW.js";
import { verifyPermissionsMW } from "../../middlewares/verifyPermissionsMW.js";
import { ROLES }               from "../../constants/roles.js";

// ============================================================
//                      REVIEW ROUTES
// ============================================================
// Two routers — register both in app.js:
//
//   import reviewRouter, { productReviewRouter } from "./modules/review/review.routes.js";
//   app.use("/api/products/:productId/reviews", productReviewRouter);
//   app.use("/api/reviews", reviewRouter);

// ─── Product-scoped  →  /api/products/:productId/reviews ─────────────────────
export const productReviewRouter = express.Router({ mergeParams: true });

// GET  /api/products/:productId/reviews
productReviewRouter.get(
  "/",
  validateMongoIdParam("productId"),
  validatePagination,
  getProductReviews
);

// POST /api/products/:productId/reviews
productReviewRouter.post(
  "/",
  verifyAccessMW,
  verifyPermissionsMW([ROLES.CUSTOMER]),
  validateMongoIdParam("productId"),
  validateCreateReview,
  createReview
);

// ─── Standalone  →  /api/reviews ─────────────────────────────────────────────
const router = express.Router();

// GET    /api/reviews/:reviewId
router.get("/:reviewId", validateMongoIdParam("reviewId"), getReviewById);

// PUT    /api/reviews/:reviewId   (owner only)
router.put(
  "/:reviewId",
  verifyAccessMW,
  verifyPermissionsMW([ROLES.CUSTOMER]),
  validateUpdateReview,
  updateReview
);

// DELETE /api/reviews/:reviewId   (owner or admin)
router.delete(
  "/:reviewId",
  verifyAccessMW,
  verifyPermissionsMW([ROLES.CUSTOMER, ROLES.ADMIN]),
  validateMongoIdParam("reviewId"),
  deleteReview
);

export default router;