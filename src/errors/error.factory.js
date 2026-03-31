/**
 * @file errorFactories.js
 * @description Factory functions for creating typed HTTP errors.
 * instead of throwing raw errors to keep error handling consistent.
 *
 * @Usage throw createNotFoundError("User not found");
 */

import { HTTP_STATUS } from "../constants/httpStatus.js";
import { ApiError } from "./apiError.js";

// 400 — missing or invalid params
export const createBadRequestError = (message = "Bad request") =>
  new ApiError(HTTP_STATUS.BAD_REQUEST, message);

// 401 — user must login first
export const createUnauthorizedError = (message = "Unauthorized") =>
  new ApiError(HTTP_STATUS.UNAUTHORIZED, message);

// 403 — authenticated but lacks permission
export const createForbiddenError = (message = "Forbidden") =>
  new ApiError(HTTP_STATUS.FORBIDDEN, message);

// 404 — resource does not exist
export const createNotFoundError = (message = "Resource not found") =>
  new ApiError(HTTP_STATUS.NOT_FOUND, message);

// 409 — resource already exists - like duplicate email
export const createConflictError = (message = "Resource already exists") =>
  new ApiError(HTTP_STATUS.CONFLICT, message);

// 422 — request understood but data failed validation
export const createValidationError = (message = "Validation error") =>
  new ApiError(HTTP_STATUS.UNPROCESSABLE_ENTITY, message);

// 429 — client sent too many requests in a short period
export const createTooManyRequestsError = (message = "Too many requests") =>
  new ApiError(HTTP_STATUS.TOO_MANY_REQUESTS, message);

// 500 — unexpected server failure, not from the client
export const createInternalError = (message = "Internal server error") =>
  new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, message);
