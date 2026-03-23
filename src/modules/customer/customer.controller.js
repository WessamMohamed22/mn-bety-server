import * as CustomerService from "./customer.service.js";
import asyncHandler from "../../middlewares/asyncHandler.js";
import { MESSAGES } from "../../constants/messages.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { successResponse } from "../../utils/apiResponse.util.js";
import { createBadRequestError } from "../../errors/error.factory.js";

// ─── Customer (self) ──────────────────────────────────────────────────────────

export const getMe = asyncHandler(async (req, res) => {
  const profile = await CustomerService.getMe(req.decoded.userId);
  return res
    .status(HTTP_STATUS.OK)
    .json(successResponse({ profile }, MESSAGES.USER.FETCHED));
});

export const updateMe = asyncHandler(async (req, res) => {
  const profile = await CustomerService.updateMe(req.decoded.userId, req.body);
  return res
    .status(HTTP_STATUS.OK)
    .json(successResponse({ profile }, MESSAGES.USER.UPDATED));
});

export const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.uploadedImage)
    throw createBadRequestError("Please upload an image.");

  const profile = await CustomerService.updateAvatar(
    req.decoded.userId,
    req.uploadedImage
  );
  return res
    .status(HTTP_STATUS.OK)
    .json(successResponse({ profile }, MESSAGES.USER.UPDATED));
});

export const deleteMe = asyncHandler(async (req, res) => {
  await CustomerService.deleteMe(req.decoded.userId);
  return res
    .status(HTTP_STATUS.OK)
    .json(successResponse(null, MESSAGES.USER.DELETED));
});

export const changeMyPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await CustomerService.changeMyPassword(
    req.decoded.userId,
    currentPassword,
    newPassword
  );
  return res
    .status(HTTP_STATUS.OK)
    .json(successResponse(null, MESSAGES.AUTH.PASSWORD_CHANGED));
});

// ─── Admin ────────────────────────────────────────────────────────────────────

export const getAllUsers = asyncHandler(async (req, res) => {
  const result = await CustomerService.getAllUsers(req.query);
  return res
    .status(HTTP_STATUS.OK)
    .json(successResponse(result, MESSAGES.USER.FETCHED));
});

export const getUserById = asyncHandler(async (req, res) => {
  const profile = await CustomerService.getUserById(req.params.id);
  return res
    .status(HTTP_STATUS.OK)
    .json(successResponse({ profile }, MESSAGES.USER.FETCHED));
});

export const deleteUser = asyncHandler(async (req, res) => {
  await CustomerService.deleteUser(req.params.id);
  return res
    .status(HTTP_STATUS.OK)
    .json(successResponse(null, MESSAGES.USER.DELETED));
});

export const toggleUserStatus = asyncHandler(async (req, res) => {
  const { isActive } = await CustomerService.toggleUserStatus(req.params.id);
  const message = isActive
    ? "User activated successfully."
    : "User deactivated successfully.";
  return res
    .status(HTTP_STATUS.OK)
    .json(successResponse({ isActive }, message));
});