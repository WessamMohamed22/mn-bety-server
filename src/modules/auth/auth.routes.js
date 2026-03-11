import express from "express";
import * as AuthController from "./auth.controller.js";

const router = express.Router();

// ============================================================
//                        AUTH ROUTES
// ============================================================

// ----------------- Public Routes -----------------
router.post("/register-user", AuthController.register);

export default router;
