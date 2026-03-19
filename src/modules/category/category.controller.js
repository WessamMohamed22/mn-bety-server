import * as CategoryService from "./category.service.js";
import asyncHandler from "../../middlewares/asynHandler.js";
import { MESSAGES } from "../../constants/messages.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import {
  createdResponse,
  successResponse,
} from "../../utils/apiResponse.util.js";

// ============================================================
//                   CATEGORY CONTROLLER
// ============================================================

/**
 * @desc    Create a new category
 * @route   POST /api/categories
 * @access  Admin
 */
export const createCategory = asyncHandler(async (req, res) => {
  const category = await CategoryService.createCategory(
    req.body,
    req.uploadedImage ?? null
  );

  return res
    .status(HTTP_STATUS.CREATED)
    .json(createdResponse({ category }, MESSAGES.CATEGORY.CREATED));
});

// ------------------------------------------------------------

/**
 * @desc    Get all categories (flat list or tree)
 * @route   GET /api/categories?active=true&tree=true
 * @access  Public
 */
export const getAllCategories = asyncHandler(async (req, res) => {
  const { active, tree } = req.query;

  const categories = await CategoryService.getAllCategories({ active, tree });

  return res
    .status(HTTP_STATUS.OK)
    .json(successResponse({ categories }, MESSAGES.CATEGORY.FETCHED_ALL));
});

// ------------------------------------------------------------

/**
 * @desc    Get a single category by ID or slug
 * @route   GET /api/categories/:idOrSlug
 * @access  Public
 */
export const getCategoryByIdOrSlug = asyncHandler(async (req, res) => {
  const category = await CategoryService.getCategoryByIdOrSlug(
    req.params.idOrSlug
  );

  return res
    .status(HTTP_STATUS.OK)
    .json(successResponse({ category }, MESSAGES.CATEGORY.FETCHED));
});

// ------------------------------------------------------------

/**
 * @desc    Get direct children of a parent category
 * @route   GET /api/categories/:parentId/children
 * @access  Public
 */
export const getChildCategories = asyncHandler(async (req, res) => {
  const children = await CategoryService.getChildCategories(
    req.params.parentId
  );

  return res
    .status(HTTP_STATUS.OK)
    .json(successResponse({ children }, MESSAGES.CATEGORY.FETCHED_CHILDREN));
});

// ------------------------------------------------------------

/**
 * @desc    Update a category
 * @route   PUT /api/categories/:id
 * @access  Admin
 */
export const updateCategory = asyncHandler(async (req, res) => {
  const category = await CategoryService.updateCategory(
    req.params.id,
    req.body,
    req.uploadedImage ?? null
  );

  return res
    .status(HTTP_STATUS.OK)
    .json(successResponse({ category }, MESSAGES.CATEGORY.UPDATED));
});

// ------------------------------------------------------------

/**
 * @desc    Toggle category active status
 * @route   PATCH /api/categories/:id/toggle
 * @access  Admin
 */
export const toggleCategoryStatus = asyncHandler(async (req, res) => {
  const { isActive } = await CategoryService.toggleCategoryStatus(
    req.params.id
  );

  const message = isActive
    ? MESSAGES.CATEGORY.ACTIVATED
    : MESSAGES.CATEGORY.DEACTIVATED;

  return res
    .status(HTTP_STATUS.OK)
    .json(successResponse({ isActive }, message));
});

// ------------------------------------------------------------

/**
 * @desc    Delete a category
 * @route   DELETE /api/categories/:id
 * @access  Admin
 */
export const deleteCategory = asyncHandler(async (req, res) => {
  await CategoryService.deleteCategory(req.params.id);

  return res
    .status(HTTP_STATUS.OK)
    .json(successResponse(null, MESSAGES.CATEGORY.DELETED));
});

// ------------------------------------------------------------

/**
 * @desc    Bulk reorder categories
 * @route   PATCH /api/categories/reorder
 * @access  Admin
 */
export const reorderCategories = asyncHandler(async (req, res) => {
  await CategoryService.reorderCategories(req.body.items);

  return res
    .status(HTTP_STATUS.OK)
    .json(successResponse(null, MESSAGES.CATEGORY.REORDERED));
});