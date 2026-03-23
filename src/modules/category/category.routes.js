import express from "express";
import {
  createCategory,
  getAllCategories,
  getCategoryByIdOrSlug,
  getChildCategories,
  updateCategory,
  toggleCategoryStatus,
  deleteCategory,
  reorderCategories,
} from "./category.controller.js";
import {
  validateCreateCategory,
  validateUpdateCategory,
  validateMongoIdParam,
  validateGetAllQuery,
  validateReorder,
} from "./category.validation.js";
import { verifyAccessMW } from "../../middlewares/verifyAccessMW.js";
import { verifyPermissionsMW } from "../../middlewares/verifyPermissionsMW.js";
import { uploadCategoryImage } from "../../middlewares/upload.middleware.js";
import { ROLES } from "../../constants/roles.js";

const router = express.Router();

// ─── Public ───────────────────────────────────────────────────────────────────

router.get("/", validateGetAllQuery, getAllCategories);
router.get("/:parentId/children", validateMongoIdParam("parentId"), getChildCategories);
router.get("/:idOrSlug", getCategoryByIdOrSlug);

// ─── Admin only ───────────────────────────────────────────────────────────────

router.post(
  "/",
  verifyAccessMW,
  verifyPermissionsMW([ROLES.ADMIN]),
  uploadCategoryImage,
  validateCreateCategory,
  createCategory
);

router.put(
  "/:id",
  verifyAccessMW,
  verifyPermissionsMW([ROLES.ADMIN]),
  uploadCategoryImage,
  validateUpdateCategory,
  updateCategory
);

// /reorder must come BEFORE /:id to avoid Express matching "reorder" as an id
router.patch(
  "/reorder",
  verifyAccessMW,
  verifyPermissionsMW([ROLES.ADMIN]),
  validateReorder,
  reorderCategories
);

router.patch(
  "/:id/toggle",
  verifyAccessMW,
  verifyPermissionsMW([ROLES.ADMIN]),
  validateMongoIdParam("id"),
  toggleCategoryStatus
);

router.delete(
  "/:id",
  verifyAccessMW,
  verifyPermissionsMW([ROLES.ADMIN]),
  validateMongoIdParam("id"),
  deleteCategory
);

export default router;