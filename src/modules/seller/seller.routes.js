import express from "express";
import {
  getMySellerProfile,
  updateSellerProfile,
  updateSellerLogo,
  getAllSellers,
  getSellerById,
  approveSeller,
  toggleSellerStatus,
  upgradeToSeller,
  deleteSellerAccount,
  getPublicSellers,
  getPublicSellerProfile,
  rejectSeller,

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
import { requireVerifiedEmailMW } from "../../middlewares/requireVerifiedEmailMW.js";



const router = express.Router();

// ─── Public Routes ──────────────────────────────────────────
router.get("/public", getPublicSellers);
router.get("/public/:id", getPublicSellerProfile);
router.use(verifyAccessMW);
router.use(requireVerifiedEmailMW); 

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

// ─── Upgrade to Seller ────────────────────────────────────────────────────────
router.post("/upgrade",
  verifyPermissionsMW([ROLES.CUSTOMER]),
  validateUpdateProfile, // reuse same validation — description, location, bankInfo
  upgradeToSeller
);

// ─── Delete Seller Account only ───────────────────────────────────────────────
router.delete("/me",
  verifyPermissionsMW([ROLES.SELLER]),
  deleteSellerAccount
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
router.patch("/:id/reject",
  verifyPermissionsMW([ROLES.ADMIN]),
  validateMongoIdParam("id"),
  rejectSeller
);

router.patch("/:id/toggle",
  verifyPermissionsMW([ROLES.ADMIN]),
  validateMongoIdParam("id"),
  toggleSellerStatus
);

export default router;