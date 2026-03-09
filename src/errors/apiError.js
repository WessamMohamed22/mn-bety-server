/**
 * @file apiError.js
 * @description Custom error class that extends the built-in Error.
 * All thrown errors in the app should be instances of ApiError.
 *
 * @Usage throw new ApiError(404, "User not found");
 */

import { HTTP_STATUS } from "../constants/httpStatus.js";


// ApiError Class
export class ApiError extends Error {
  constructor(statusCode, message, isOperational = true, stack = "") {
    // Pass message to built-in Error — sets this.message
    super(message);
    this.statusCode = statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    // true  = expected/handled error
    // false = unexpected crash
    this.isOperational = isOperational;
    this.success = false;

    // captureStackTrace excludes the ApiError constructor frame
    // so the trace points to where the error was actually thrown
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
