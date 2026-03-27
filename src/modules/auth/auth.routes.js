import express from "express";
import * as AuthController from "./auth.controller.js";
import { verifyAccessMW } from "../../middlewares/verifyAccessMW.js";

// ============================================================
//                        AUTH ROUTES
// ============================================================

const router = express.Router();

// ----------------- Public Routes -----------------
router.post("/register", AuthController.register);

router.post("/verify-email", AuthController.verifyEmail);

router.post("/login", AuthController.login);

router.post("/logout", AuthController.logout);

router.post("/refresh-token", AuthController.refreshToken);

router.post("/forgot-password", AuthController.forgotPassword);

router.post("/reset-password", AuthController.resetPassword);

// ----------------- Private Routes -----------------
router.use(verifyAccessMW);

router.patch("/change-password", AuthController.changePassword);

router.post("/resend-verification", AuthController.resendVerification);

router.get("/me", AuthController.getMe);

router.patch("/me", AuthController.updateMe);

router.delete("/delete-account", AuthController.deleteAccount);


export default router;
