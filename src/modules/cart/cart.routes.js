import express from "express";
import {
  getUserCart,
  addToCart,
  updateCartItemQuantity,
  removeFromCart,
  clearCart,
} from "./cart.controller.js";
import {
  validateAddToCart,
  validateUpdateQuantity,
  validateProductIdParam,
} from "./cart.validation.js";
import { verifyAccessMW } from "../../middlewares/verifyAccessMW.js";
import { verifyPermissionsMW } from "../../middlewares/verifyPermissionsMW.js";
import { ROLES } from "../../constants/roles.js";

const router = express.Router();

// User must be logged in and have the 'USER' role to use the cart
router.use(verifyAccessMW, verifyPermissionsMW([ROLES.CUSTOMER]));

router.get("/", getUserCart);
router.post("/", validateAddToCart, addToCart);
router.patch("/:productId", validateProductIdParam, validateUpdateQuantity, updateCartItemQuantity);
router.delete("/", clearCart);
router.delete("/:productId", validateProductIdParam, removeFromCart);

export default router;