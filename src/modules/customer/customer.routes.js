import express from "express";
import {
  getMyProfile,
  updateMyProfile,
  updateMyAvatar,
  deleteMyCustomerAccount,
} from "./customer.controller.js";
import { validateUpdateMe }    from "./customer.validation.js";
import { verifyAccessMW }      from "../../middlewares/verifyAccessMW.js";
import { verifyPermissionsMW } from "../../middlewares/verifyPermissionsMW.js";
import { uploadAvatarImage }   from "../../middlewares/upload.middleware.js";
import { ROLES }               from "../../constants/roles.js";

const router = express.Router();

// all routes require login + CUSTOMER role
router.use(verifyAccessMW, verifyPermissionsMW([ROLES.CUSTOMER]));

router.get("/me",                            getMyProfile);
router.put("/me",  validateUpdateMe,         updateMyProfile);
router.delete("/me",                         deleteMyCustomerAccount);
router.post("/me/avatar", uploadAvatarImage, updateMyAvatar);

export default router;