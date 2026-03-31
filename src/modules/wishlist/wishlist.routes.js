import express from "express";
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
  checkProductInWishlist,
} from "./wishlist.controller.js";
import {
  validateAddToWishlist,
  validateProductIdParam,
} from "./wishlist.validation.js";
import { verifyAccessMW } from "../../middlewares/verifyAccessMW.js";
import { verifyPermissionsMW } from "../../middlewares/verifyPermissionsMW.js";
import { ROLES } from "../../constants/roles.js";

const router = express.Router();

// All wishlist routes require login + USER role
router.use(verifyAccessMW, verifyPermissionsMW([ROLES.CUSTOMER]));

router.get("/", getWishlist);
router.post("/", validateAddToWishlist, addToWishlist);
router.delete("/", clearWishlist);
router.get("/:productId", validateProductIdParam, checkProductInWishlist);
router.delete("/:productId", validateProductIdParam, removeFromWishlist);

export default router;
