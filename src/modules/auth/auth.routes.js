import express from "express";
import * as AuthController from "./auth.controller.js";
import { verifyAccessMW } from "../../middlewares/verifyAccessMW.js";

// ============================================================
//                        AUTH ROUTES
// ============================================================

const router = express.Router();

// ----------------- Public Routes -----------------
router.post("/register", AuthController.register);

router.post("/login", AuthController.login);

router.post("/logout", AuthController.logout);

router.post("/refresh-token", AuthController.refreshToken);

// ----------------- Private Routes -----------------
router.use(verifyAccessMW);

router.post("/change-password", AuthController.changePassword);

router.get("/me", AuthController.getMe);

router.patch("/me", AuthController.updateMe);

router.delete("/delete-account", AuthController.deleteAccount);

export default router;
