import express from "express";
import * as AuthController from "./auth.controller.js";

const router = express.Router();

// ============================================================
//                        AUTH ROUTES
// ============================================================

// ----------------- Public Routes -----------------
router.post("/register-user", AuthController.register);
router.post("/login", AuthController.login);

// ----------------- Private Routes -----------------
router.post("/logout", AuthController.logout);
router.post("/refresh-token", AuthController.refreshToken);



export default router;
