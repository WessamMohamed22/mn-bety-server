/**
 * @file errorHandler.js
 * @description Global error handling middleware for Express.
 * Catches all errors passed through next(err) & returns a clean JSON response.
 * Must be added as the LAST middleware in app.js
 *
 * Handles:
 * - ApiError (operational/expected errors)
 * - Mongoose errors (CastError, ValidationError, duplicate key)
 * - JWT errors (invalid token, expired token)
 * - Unknown errors (fallback to 500)
 *
 * @reminder help to handle errors if i forget handling it like JWT, Mongoose
 */

import { HTTP_STATUS } from "../constants/httpStatus.js";
import { env } from "../config/env.js";
import { MESSAGES } from "../constants/messages.js";
import { JWT_ERRORS, MONGOOSE_ERRORS } from "../constants/errorTypes.js";

export const errorHandler = (err, req, res, next) => {
  // use shallow copy
  let error = { ...err };
  console.log(err)
  error.message = err.message || MESSAGES.ERROR.SERVER_ERROR;
  // if no status code then set it 500
  error.statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;

  // Mongoose: Invalid ObjectId
  // Triggered when an invalid id format is passed
  if (err.name === MONGOOSE_ERRORS.CAST_ERROR) {
    error.statusCode = HTTP_STATUS.NOT_FOUND;
    error.message = MESSAGES.ERROR.NOT_FOUND;
  }

  // Mongoose: Duplicate Key
  // Triggered when a unique field already exists
  if (err.code === MONGOOSE_ERRORS.DUPLICATE_KEY) {
    const field = Object.keys(err.keyValue)[0]; // get field name
    error.statusCode = HTTP_STATUS.CONFLICT;
    error.message = `${field} already exists`;
  }

  // Mongoose: Validation Error
  // Triggered when schema validation fails
  if (err.name === MONGOOSE_ERRORS.VALIDATION_ERROR) {
    const fields = Object.values(err.errors).map((e) => e.message);
    error.statusCode = HTTP_STATUS.UNPROCESSABLE_ENTITY;
    error.message = fields.join(", ");
  }

  // JWT: Invalid Token
  if (err.name === JWT_ERRORS.INVALID) {
    error.statusCode = HTTP_STATUS.UNAUTHORIZED;
    error.message = MESSAGES.AUTH.INVALID_TOKEN;
  }

  // JWT: Expired Token
  if (err.name === JWT_ERRORS.EXPIRED) {
    error.statusCode = HTTP_STATUS.UNAUTHORIZED;
    error.message = MESSAGES.AUTH.TOKEN_EXPIRED;
  }

  res.status(error.statusCode).json({
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    ...(env.isDevelopment && { stack: err.stack }),
  });
};
