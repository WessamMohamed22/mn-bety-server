import * as SellerService from "./seller.service.js";
import asyncHandler from "../../middlewares/asyncHandler.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { successResponse, createdResponse } from "../../utils/apiResponse.util.js";
import { createBadRequestError } from "../../errors/error.factory.js";
import { MESSAGES } from "../../constants/messages.js";

// ─── Seller (self) ────────────────────────────────────────────────────────────

export const getMySellerProfile = asyncHandler(async (req, res) => {
  const seller = await SellerService.getMySellerProfile(req.decoded.userId);
  return res
    .status(HTTP_STATUS.OK)
    .json(successResponse({ seller }, MESSAGES.SELLER.FETCHED));
});

export const updateSellerProfile = asyncHandler(async (req, res) => {
  const seller = await SellerService.updateSellerProfile(
    req.decoded.userId,
    req.body
  );
  return res
    .status(HTTP_STATUS.OK)
    .json(successResponse({ seller }, MESSAGES.SELLER.UPDATED));
});

export const updateSellerLogo = asyncHandler(async (req, res) => {
  if (!req.uploadedImage)
    throw createBadRequestError("Please upload an image.");

  const seller = await SellerService.updateSellerLogo(
    req.decoded.userId,
    req.uploadedImage
  );
  return res
    .status(HTTP_STATUS.OK)
    .json(successResponse({ seller }, MESSAGES.SELLER.UPDATED));
});

// ------------------------------------------------------------

export const upgradeToSeller = asyncHandler(async (req, res) => {
  const { seller, accessToken } = await SellerService.upgradeToSeller(
    req.decoded.userId,
    req.body
  );
  return res
    .status(HTTP_STATUS.CREATED)
    .json(createdResponse({ seller, accessToken }, "Seller account created successfully."));
});

// ------------------------------------------------------------

export const deleteSellerAccount = asyncHandler(async (req, res) => {
  const { accessToken } = await SellerService.deleteSellerAccount(
    req.decoded.userId
  );
  return res
    .status(HTTP_STATUS.OK)
    .json(successResponse({ accessToken }, "Seller account deleted successfully."));
});

// ─── Admin ────────────────────────────────────────────────────────────────────

export const getAllSellers = asyncHandler(async (req, res) => {
  const result = await SellerService.getAllSellers(req.query);
  return res
    .status(HTTP_STATUS.OK)
    .json(successResponse(result, MESSAGES.SELLER.FETCHED_ALL));
});

export const getSellerById = asyncHandler(async (req, res) => {
  const seller = await SellerService.getSellerById(req.params.id);
  return res
    .status(HTTP_STATUS.OK)
    .json(successResponse({ seller }, MESSAGES.SELLER.FETCHED));
});

export const approveSeller = asyncHandler(async (req, res) => {
  const { isApproved } = await SellerService.approveSeller(req.params.id);
  return res
    .status(HTTP_STATUS.OK)
    .json(successResponse({ isApproved }, MESSAGES.SELLER.APPROVED));
});

export const toggleSellerStatus = asyncHandler(async (req, res) => {
  const { isActive } = await SellerService.toggleSellerStatus(req.params.id);
  const message = isActive
    ? MESSAGES.SELLER.ACTIVATED
    : MESSAGES.SELLER.DEACTIVATED;
  return res
    .status(HTTP_STATUS.OK)
    .json(successResponse({ isActive }, message));
});