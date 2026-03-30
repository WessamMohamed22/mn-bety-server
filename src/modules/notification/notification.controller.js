import * as NotificationService from "./notification.service.js";
import asyncHandler from "../../middlewares/asyncHandler.js";
import { successResponse } from "../../utils/apiResponse.util.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";

export const getMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await NotificationService.getUserNotifications(req.decoded.userId);
  return res.status(HTTP_STATUS.OK).json(successResponse({ notifications }, "Notifications fetched"));
});

export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await NotificationService.markAsRead(req.params.id, req.decoded.userId);
  return res.status(HTTP_STATUS.OK).json(successResponse({ notification }, "Marked as read"));
});