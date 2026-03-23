import * as ProductService from "./product.service.js";
import asyncHandler from "../../middlewares/asyncHandler.js";
import { MESSAGES } from "../../constants/messages.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import {
  createdResponse,
  successResponse,
} from "../../utils/apiResponse.util.js";

// ============================================================
//                   PRODUCT CONTROLLER
// ============================================================

/**
 * @desc    Create a new product
 * @route   POST /api/products
 * @access  Seller
 */
export const createProduct = asyncHandler(async (req, res) => {
  const images = req.uploadedImages ?? [];
  const userId = req.decoded.userId;

  const product = await ProductService.createProduct(req.body, images, userId);

  return res
    .status(HTTP_STATUS.CREATED)
    .json(createdResponse({ product }, MESSAGES.PRODUCT.CREATED));
});

// ------------------------------------------------------------

/**
 * @desc    Get all products
 * @route   GET /api/products
 * @access  Public
 */
export const getAllProducts = asyncHandler(async (req, res) => {
  const result = await ProductService.getAllProducts(req.query);

  return res
    .status(HTTP_STATUS.OK)
    .json(successResponse(result, MESSAGES.PRODUCT.FETCHED_ALL));
});

// ------------------------------------------------------------

/**
 * @desc    Get single product by id or slug
 * @route   GET /api/products/:idOrSlug
 * @access  Public
 */
export const getProductByIdOrSlug = asyncHandler(async (req, res) => {
  const product = await ProductService.getProductByIdOrSlug(
    req.params.idOrSlug
  );

  return res
    .status(HTTP_STATUS.OK)
    .json(successResponse({ product }, MESSAGES.PRODUCT.FETCHED));
});

// ------------------------------------------------------------

/**
 * @desc    Get all products for a specific seller
 * @route   GET /api/products/seller/:sellerId
 * @access  Public
 */
export const getSellerProducts = asyncHandler(async (req, res) => {
  const products = await ProductService.getSellerProducts(
    req.params.sellerId
  );

  return res
    .status(HTTP_STATUS.OK)
    .json(successResponse({ products }, MESSAGES.PRODUCT.FETCHED_ALL));
});

// ------------------------------------------------------------

/**
 * @desc    Update a product
 * @route   PUT /api/products/:id
 * @access  Seller (owner only)
 */
export const updateProduct = asyncHandler(async (req, res) => {
  const images = req.uploadedImages ?? [];
  const userId = req.decoded.userId;

  const product = await ProductService.updateProduct(
    req.params.id,
    req.body,
    images,
    userId
  );

  return res
    .status(HTTP_STATUS.OK)
    .json(successResponse({ product }, MESSAGES.PRODUCT.UPDATED));
});

// ------------------------------------------------------------

/**
 * @desc    Delete a product
 * @route   DELETE /api/products/:id
 * @access  Seller (owner) + Admin
 */
export const deleteProduct = asyncHandler(async (req, res) => {
  const userId = req.decoded.userId;
  const roles = req.decoded.roles;

  await ProductService.deleteProduct(req.params.id, userId, roles);

  return res.status(HTTP_STATUS.NO_CONTENT).end();
});

// ------------------------------------------------------------

/**
 * @desc    Toggle product active status
 * @route   PATCH /api/products/:id/toggle
 * @access  Seller (owner) + Admin
 */
export const toggleProductStatus = asyncHandler(async (req, res) => {
  const userId = req.decoded.userId;
  const roles = req.decoded.roles;

  const { isActive } = await ProductService.toggleProductStatus(
    req.params.id,
    userId,
    roles
  );

  const message = isActive
    ? MESSAGES.PRODUCT.ACTIVATED
    : MESSAGES.PRODUCT.DEACTIVATED;

  return res
    .status(HTTP_STATUS.OK)
    .json(successResponse({ isActive }, message));
});

// ------------------------------------------------------------

/**
 * @desc    Approve a product
 * @route   PATCH /api/products/:id/approve
 * @access  Admin only
 */
export const approveProduct = asyncHandler(async (req, res) => {
  const { isApproved } = await ProductService.approveProduct(req.params.id);

  return res
    .status(HTTP_STATUS.OK)
    .json(successResponse({ isApproved }, MESSAGES.PRODUCT.APPROVED));
});