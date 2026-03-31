import express from "express";
import { getMyNotifications, markAsRead } from "./notification.controller.js";
import { verifyAccessMW } from "../../middlewares/verifyAccessMW.js";

const router = express.Router();

router.use(verifyAccessMW);

router.get("/", getMyNotifications);
router.patch("/:id/read", markAsRead);

export default router;