import express from "express";
import * as AuthController from "./auth.controller.js";
import { verifyAccessMW } from "../../middlewares/verifyAccessMW.js";

const router = express.Router();

// ============================================================
//                        AUTH ROUTES
// ============================================================

// ----------------- Public Routes -----------------
router.post("/register", AuthController.register);

router.post("/login", AuthController.login);

router.post("/logout", AuthController.logout);

router.post("/refresh-token", AuthController.refreshToken);

// ----------------- Private Routes -----------------
router.use(verifyAccessMW);

router.post("/change-password", AuthController.changePassword);

export default router;
