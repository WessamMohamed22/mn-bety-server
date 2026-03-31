import express from "express";
import {
  createProduct,
  getAllProducts,
  getProductByIdOrSlug,
  getSellerProducts,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
  approveProduct,
} from "./product.controller.js";
import {
  validateCreateProduct,
  validateUpdateProduct,
  validateMongoIdParam,
  validateProductQuery,
} from "./product.validation.js";
import { verifyAccessMW } from "../../middlewares/verifyAccessMW.js";
import { verifyPermissionsMW } from "../../middlewares/verifyPermissionsMW.js";
import { uploadProductImages } from "../../middlewares/upload.middleware.js";
import { ROLES } from "../../constants/roles.js";

const router = express.Router();

// ─── Public ───────────────────────────────────────────────────────────────────
router.get("/", validateProductQuery, getAllProducts);
router.get("/seller/:sellerId", validateMongoIdParam("sellerId"), getSellerProducts);
router.get("/:idOrSlug", getProductByIdOrSlug);

// ─── Seller only ──────────────────────────────────────────────────────────────
router.post(
  "/",
  verifyAccessMW,
  verifyPermissionsMW([ROLES.SELLER]),
  uploadProductImages,
  validateCreateProduct,
  createProduct
);

router.put(
  "/:id",
  verifyAccessMW,
  verifyPermissionsMW([ROLES.SELLER]),
  uploadProductImages,
  validateUpdateProduct,
  updateProduct
);

// ─── Seller (owner) + Admin ───────────────────────────────────────────────────
router.delete(
  "/:id",
  verifyAccessMW,
  verifyPermissionsMW([ROLES.SELLER, ROLES.ADMIN]),
  validateMongoIdParam("id"),
  deleteProduct
);

router.patch(
  "/:id/toggle",
  verifyAccessMW,
  verifyPermissionsMW([ROLES.SELLER, ROLES.ADMIN]),
  validateMongoIdParam("id"),
  toggleProductStatus
);

// ─── Admin only ───────────────────────────────────────────────────────────────
router.patch(
  "/:id/approve",
  verifyAccessMW,
  verifyPermissionsMW([ROLES.ADMIN]),
  validateMongoIdParam("id"),
  approveProduct
);

export default router;