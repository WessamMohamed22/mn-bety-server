export const MESSAGES = {
  VALIDATION: {
    INVALID_EMAIL: "Please provide a valid email address",
    INVALID_PASSWORD:
      "Password must contain uppercase, lowercase, number and special character",
    INVALID_PHONE: "Invalid phone number format",
    REQUIRED_FIELDS: "All required fields must be provided",
    INVALID_ID: "Invalid ID format",
  },

  AUTH: {
    // success
    REGISTER_SUCCESS: "Registered successfully",
    LOGIN_SUCCESS: "Logged in successfully",
    LOGOUT_SUCCESS: "Logged out successfully",
    TOKEN_REFRESHED: "Token refreshed successfully",

    // 401 - authentication errors
    LOGIN_FAILED: "Invalid email or password",
    NO_TOKEN: "No token provided",
    INVALID_TOKEN: "Invalid or expired token",
    TOKEN_EXPIRED: "Token has expired",
    TOKEN_FAILED: "Token verification failed",
    NO_PERMISSION: "You do not have permission to access this resource",
  },

  USER: {
    NOT_FOUND: "User not found",
    EMAIL_ALREADY_EXISTS: "Email already exists",
    FETCHED: "User fetched successfully",
    UPDATED: "User updated successfully",
    DELETED: "User deleted successfully",
    PASSWORD_CHANGED: "Password changed successfully",
  },

  SUCCESS: {
    FETCHED: "Data fetched successfully",
    CREATED: "Created successfully",
    UPDATED: "Updated successfully",
    DELETED: "Deleted successfully",
  },

  ERROR: {
    SERVER_ERROR: "Something went wrong",
    VALIDATION_ERROR: "Validation failed",
    NOT_FOUND: "Resource not found", // 404
    BAD_REQUEST: "Bad request", // 400
    UNAUTHORIZED: "Unauthorized access", // 401
    FORBIDDEN: "You do not have permission to perform this action", // 403
    INSUFFICIENT_ROLE: "Insufficient role to access this resource", // 403
    CONFLICT: "Resource already exists", // 409
  },

  SECURITY: {
    ACCOUNT_LOCKED: "Account temporarily locked", // 401
    TOO_MANY_REQUESTS: "Too many requests, please try again later", // 429
    PASSWORD_RESET_SENT: "Password reset link sent to your email",
    PASSWORD_RESET_SUCCESS: "Password reset successfully",
  },
};
