import express from "express";
import {
  getMySellerProfile,
  updateSellerProfile,
  updateSellerLogo,
  getAllSellers,
  getSellerById,
  approveSeller,
  toggleSellerStatus,
} from "./seller.controller.js";
import {
  validateUpdateProfile,
  validateGetAllQuery,
  validateMongoIdParam,
} from "./seller.validation.js";
import { verifyAccessMW }      from "../../middlewares/verifyAccessMW.js";
import { verifyPermissionsMW } from "../../middlewares/verifyPermissionsMW.js";
import { uploadSellerLogo }    from "../../middlewares/upload.middleware.js";
import { ROLES }               from "../../constants/roles.js";

const router = express.Router();

router.use(verifyAccessMW);

// ─── Seller (self) ────────────────────────────────────────────────────────────
router.get("/me",
  verifyPermissionsMW([ROLES.SELLER]),
  getMySellerProfile
);

router.put("/me",
  verifyPermissionsMW([ROLES.SELLER]),
  validateUpdateProfile,
  updateSellerProfile
);

router.post("/me/logo",
  verifyPermissionsMW([ROLES.SELLER]),
  uploadSellerLogo,      // field: "sellerLogo"
  updateSellerLogo
);

// ─── Admin only ───────────────────────────────────────────────────────────────
router.get("/",
  verifyPermissionsMW([ROLES.ADMIN]),
  validateGetAllQuery,
  getAllSellers
);

router.get("/:id",
  verifyPermissionsMW([ROLES.ADMIN]),
  validateMongoIdParam("id"),
  getSellerById
);

router.patch("/:id/approve",
  verifyPermissionsMW([ROLES.ADMIN]),
  validateMongoIdParam("id"),
  approveSeller
);

router.patch("/:id/toggle",
  verifyPermissionsMW([ROLES.ADMIN]),
  validateMongoIdParam("id"),
  toggleSellerStatus
);

export default router;