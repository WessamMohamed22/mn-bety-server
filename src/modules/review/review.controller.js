import * as ReviewService from "./review.service.js";
import asyncHandler from "../../middlewares/asyncHandler.js";
import { MESSAGES } from "../../constants/messages.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import Review from "../../DB/models/review.model.js";
 
import {
  createdResponse,
  successResponse,
} from "../../utils/apiResponse.util.js";

// ============================================================
//                     REVIEW CONTROLLER
// ============================================================

/**
 * @desc    Create a review for a product
 * @route   POST /api/products/:productId/reviews
 * @access  Private (User)
 */
export const createReview = asyncHandler(async (req, res) => {
  const review = await ReviewService.createReview(
    req.decoded.userId,
    req.params.productId,
    req.body
  );

  return res
    .status(HTTP_STATUS.CREATED)
    .json(createdResponse({ review }, MESSAGES.REVIEW.CREATED));
});

// ------------------------------------------------------------

/**
 * @desc    Get all reviews for a product
 * @route   GET /api/products/:productId/reviews
 * @access  Public
 */
export const getProductReviews = asyncHandler(async (req, res) => {
  const result = await ReviewService.getProductReviews(
    req.params.productId,
    req.query
  );

  return res
    .status(HTTP_STATUS.OK)
    .json(successResponse(result, MESSAGES.REVIEW.FETCHED_ALL));
});

// ------------------------------------------------------------

/**
 * @desc    Get a single review by id
 * @route   GET /api/reviews/:reviewId
 * @access  Public
 */
export const getReviewById = asyncHandler(async (req, res) => {
  const review = await ReviewService.getReviewById(req.params.reviewId);

  return res
    .status(HTTP_STATUS.OK)
    .json(successResponse({ review }, MESSAGES.REVIEW.FETCHED));
});

// ------------------------------------------------------------

/**
 * @desc    Update own review
 * @route   PUT /api/reviews/:reviewId
 * @access  Private (Owner)
 */
export const updateReview = asyncHandler(async (req, res) => {
  const review = await ReviewService.updateReview(
    req.params.reviewId,
    req.decoded.userId,
    req.body
  );

  return res
    .status(HTTP_STATUS.OK)
    .json(successResponse({ review }, MESSAGES.REVIEW.UPDATED));
});

// ------------------------------------------------------------

/**
 * @desc    Delete a review
 * @route   DELETE /api/reviews/:reviewId
 * @access  Private (Owner or Admin)
 */
export const deleteReview = asyncHandler(async (req, res) => {
  await ReviewService.deleteReview(
    req.params.reviewId,
    req.decoded.userId,
    req.decoded.roles
  );

  return res
    .status(HTTP_STATUS.OK)
    .json(successResponse(null, MESSAGES.REVIEW.DELETED));
});

/**
 * @desc    Get platform satisfaction statistics
 * @route   GET /api/reviews/stats/platform
 * @access  Public
 */
// في ملف review.controller.js

export const getPlatformStats = asyncHandler(async (req, res, next) => {
    // استدعاء دالة الحسابات من السيرفيس
    const stats = await ReviewService.getPlatformStatistics();

    // إرسال الرد للفرونت أند
    res.status(200).json({
        success: true,
        message: "Platform statistics fetched successfully",
        data: {
            buyerSatisfaction: stats.buyerSatisfaction,
            sellerSatisfaction: stats.sellerSatisfaction
        }
    });
});