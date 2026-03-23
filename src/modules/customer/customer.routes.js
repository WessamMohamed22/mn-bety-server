import express from "express";
import {
  getMe,
  updateMe,
  updateAvatar,
  deleteMe,
  changeMyPassword,
  getAllUsers,
  getUserById,
  deleteUser,
  toggleUserStatus,
} from "./customer.controller.js";
import {
  validateUpdateMe,
  validateChangePassword,
  validateGetAllQuery,
  validateMongoIdParam,
} from "./customer.validation.js";
import { verifyAccessMW }      from "../../middlewares/verifyAccessMW.js";
import { verifyPermissionsMW } from "../../middlewares/verifyPermissionsMW.js";
import { uploadAvatarImage }   from "../../middlewares/upload.middleware.js";
import { ROLES }               from "../../constants/roles.js";

const router = express.Router();

router.use(verifyAccessMW);

// ─── Customer (self) ──────────────────────────────────────────────────────────
router.get("/me",                    getMe);
router.put("/me", validateUpdateMe,  updateMe);
router.delete("/me",                 deleteMe);

router.post("/me/avatar",
  uploadAvatarImage,   // field: "avatar"
  updateAvatar
);

router.put("/me/change-password",
  validateChangePassword,
  changeMyPassword
);

// ─── Admin only ───────────────────────────────────────────────────────────────
router.get("/",
  verifyPermissionsMW([ROLES.ADMIN]),
  validateGetAllQuery,
  getAllUsers
);

router.get("/:id",
  verifyPermissionsMW([ROLES.ADMIN]),
  validateMongoIdParam("id"),
  getUserById
);

router.delete("/:id",
  verifyPermissionsMW([ROLES.ADMIN]),
  validateMongoIdParam("id"),
  deleteUser
);

router.patch("/:id/toggle",
  verifyPermissionsMW([ROLES.ADMIN]),
  validateMongoIdParam("id"),
  toggleUserStatus
);

export default router;