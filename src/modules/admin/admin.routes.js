import express from "express";
import * as AdminController from "./admin.controller.js";
import * as SellerController from "../seller/seller.controller.js";
import { verifyAccessMW } from "../../middlewares/verifyAccessMW.js";
import { verifyPermissionsMW } from "../../middlewares/verifyPermissionsMW.js";
import { ROLES } from "../../constants/roles.js";
import {
  validateGetAllQuery,
  validateMongoIdParam,
} from "../seller/seller.validation.js";

// ============================================================
//                        ADMIN ROUTES
// ============================================================

const router = express.Router();

// all routes require login + ADMIN role
router.use(
  verifyAccessMW,
  verifyPermissionsMW([ROLES.SUPER_ADMIN, ROLES.ADMIN])
);

// ----------------- Stats -----------------
router.get("/stats", AdminController.getStats);

// ----------------- Seller Management -----------------
router.get("/sellers", validateGetAllQuery, SellerController.getAllSellers);

router.get("/sellers/:id", validateMongoIdParam("id"), SellerController.getSellerById);

router.patch(
  "/sellers/:id/approve",
  validateMongoIdParam("id"),
  SellerController.approveSeller
);

router.patch(
  "/sellers/:id/reject",
  validateMongoIdParam("id"),
  SellerController.rejectSeller
);

router.patch(
  "/sellers/:id/toggle",
  validateMongoIdParam("id"),
  SellerController.toggleSellerStatus
);

// ----------------- User Management -----------------
router.get("/users", AdminController.getUsers);

router.get("/users/:userId", AdminController.getUserById);

router.patch("/users/:id/role", AdminController.updateUserRole);

router.patch(
  "/users/:id/demote",
  verifyPermissionsMW([ROLES.SUPER_ADMIN]),
  AdminController.demoteAdmin
);

router.patch("/users/:id/status", AdminController.toggleUserStatus);

router.patch("/users/:id/verify-email", AdminController.verifyUserEmail);

router.delete("/users/:id", AdminController.softDeleteUser);

router.delete("/users/:id/sessions", AdminController.revokeUserSessions);

export default router;
