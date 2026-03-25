import * as CustomerService from "./customer.service.js";
import asyncHandler from "../../middlewares/asyncHandler.js";
import { MESSAGES } from "../../constants/messages.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { successResponse } from "../../utils/apiResponse.util.js";
import { createBadRequestError } from "../../errors/error.factory.js";

/**
 * @desc    Get my profile
 * @route   GET /api/customers/me
 * @access  Customer
 */
export const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await CustomerService.getMyProfile(req.decoded.userId);
  return res
    .status(HTTP_STATUS.OK)
    .json(successResponse({ profile }, MESSAGES.USER.FETCHED));
});

// ------------------------------------------------------------

/**
 * @desc    Update my profile (bio, city, address)
 * @route   PUT /api/customers/me
 * @access  Customer
 */
export const updateMyProfile = asyncHandler(async (req, res) => {
  const profile = await CustomerService.updateMyProfile(
    req.decoded.userId,
    req.body
  );
  return res
    .status(HTTP_STATUS.OK)
    .json(successResponse({ profile }, MESSAGES.USER.UPDATED));
});

// ------------------------------------------------------------

/**
 * @desc    Upload / update avatar
 * @route   POST /api/customers/me/avatar
 * @access  Customer
 */
export const updateMyAvatar = asyncHandler(async (req, res) => {
  if (!req.uploadedImage)
    throw createBadRequestError("Please upload an image.");

  const profile = await CustomerService.updateMyAvatar(
    req.decoded.userId,
    req.uploadedImage
  );
  return res
    .status(HTTP_STATUS.OK)
    .json(successResponse({ profile }, MESSAGES.USER.UPDATED));
});

// ------------------------------------------------------------

/**
 * @desc    Delete my account
 * @route   DELETE /api/customers/me
 * @access  Customer
 */
export const deleteMyCustomerAccount = asyncHandler(async (req, res) => {
  await CustomerService.deleteMyCustomerAccount(req.decoded.userId);
  return res
    .status(HTTP_STATUS.OK)
    .json(successResponse(null, MESSAGES.USER.DELETED));
});