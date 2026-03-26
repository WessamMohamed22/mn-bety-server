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
    SAME_PASSWORD: "New password must be different from your current password",
    PASSWORD_CHANGED: "Your password has been changed successfully.",
    PASSWORD_RESET_SUCCESS: "Password reset successful. Please login again.",
    INVALID_CURRENT_PASSWORD: "The current password you entered is incorrect.",

    // 401 - authentication errors
    LOGIN_FAILED: "Invalid email or password",
    NO_TOKEN: "No token provided",
    INVALID_TOKEN: "Invalid or expired token",
    TOKEN_EXPIRED: "Token has expired",
    TOKEN_FAILED: "Token verification failed",
    INVALID_RESET_TOKEN: "Reset token is invalid or expired.",
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

  EMAIL: {
    SUBJECTS: {
      WELCOME: "Welcome to mn bety Platform!",
      VERIFICATION: "Verify your email address",
      PASSWORD_RESET: "Reset your password",
    },

    WELCOME_SENT: "Welcome email sent successfully.",
    VERIFICATION_SENT: "Verification email sent. Please check your inbox.",
    EMAIL_NOT_VERIFIED:
      "Please verify your email address to access this feature.",
    EMAIL_VERIFIED: "Email verified successfully.",
    EMAIL_ALREADY_VERIFIED: "Email is already verified.",
    VERIFICATION_EMAIL_RECENTLY_SENT:
      "Please wait before requesting another verification email.",
    INVALID_VERIFICATION_TOKEN: "Verification token is invalid or expired.",
    RESET_LINK_SENT: "Password reset link sent to your email.",

    SEND_FAILED: "Failed to send email. Please try again later.",
    PROVIDER_OFFLINE: "Email service is temporarily unavailable.",
    INVALID_RECIPIENT: "Cannot send email to an invalid address.",
    AUTH_FAILED: "Email service configuration error.",
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

  CATEGORY: {
    CREATED: "Category created successfully.",
    UPDATED: "Category updated successfully.",
    DELETED: "Category deleted successfully.",
    FETCHED: "Category fetched successfully.",
    FETCHED_ALL: "Categories fetched successfully.",
    FETCHED_CHILDREN: "Child categories fetched successfully.",
    ACTIVATED: "Category is now active.",
    DEACTIVATED: "Category is now inactive.",
    REORDERED: "Categories reordered successfully.",
    NOT_FOUND: "Category not found.",
    PARENT_NOT_FOUND: "Parent category not found.",
    NAME_ALREADY_EXISTS: "A category with this name already exists.",
    SELF_PARENT: "A category cannot be its own parent.",
    // Dynamic – called as a function
    HAS_CHILDREN: (count) =>
      `Cannot delete: this category has ${count} sub-categor${
        count === 1 ? "y" : "ies"
      }. Remove or re-assign them first.`,
  },

  UPLOAD: {
    INVALID_IMAGE_TYPE: "Only JPEG, PNG and WebP images are allowed.",
    CLOUDINARY_FAILED: "Failed to upload image. Please try again.",
    MAX_IMAGES: "You can upload a maximum of 5 images per product.",
  },

  PRODUCT: {
    CREATED: "Product created successfully.",
    UPDATED: "Product updated successfully.",
    FETCHED: "Product fetched successfully.",
    FETCHED_ALL: "Products fetched successfully.",
    ACTIVATED: "Product is now active.",
    DEACTIVATED: "Product is now inactive.",
    APPROVED: "Product approved successfully.",
    NOT_FOUND: "Product not found.",
    NOT_OWNER: "You are not the owner of this product.",
    PARENT_CATEGORY_NOT_ALLOWED:
      "Products can only be added to sub-categories, not main categories.",
  },

  SELLER: {
    NOT_FOUND: "Seller profile not found.",
    DELETED: "Seller account deleted successfully.",
    FETCHED: "Seller profile fetched successfully.",
    FETCHED_ALL: "Sellers fetched successfully.",
    UPDATED: "Seller profile updated successfully.",
    APPROVED: "Seller approved successfully.",
    ACTIVATED: "Seller is now active.",
    DEACTIVATED: "Seller is now inactive.",
  },

  CART: {
    FETCHED: "Cart fetched successfully.",
    ITEM_ADDED: "Item added to cart successfully.",
    ITEM_UPDATED: "Cart item updated successfully.",
    ITEM_REMOVED: "Item removed from cart successfully.",
    CLEARED: "Cart cleared successfully.",
    NOT_FOUND: "Cart not found.",
    ITEM_NOT_FOUND: "Product is not in the cart.",
    OUT_OF_STOCK: (stock) => `Only ${stock} items left in stock.`,
    STOCK_LIMIT: (stock) => `Cannot add more. Stock limit: ${stock}.`,
  },

  WISHLIST: {
    FETCHED: "Wishlist fetched successfully.",
    ITEM_ADDED: "Product added to wishlist.",
    ITEM_REMOVED: "Product removed from wishlist.",
    CLEARED: "Wishlist cleared successfully.",
    NOT_FOUND: "Wishlist not found.",
    ITEM_NOT_FOUND: "Product is not in the wishlist.",
    ALREADY_EXISTS: "Product is already in your wishlist.",
  },
  REVIEW: {
    CREATED: "Review submitted successfully.",
    UPDATED: "Review updated successfully.",
    DELETED: "Review deleted successfully.",
    FETCHED: "Review fetched successfully.",
    FETCHED_ALL: "Reviews fetched successfully.",
    NOT_FOUND: "Review not found.",
    NOT_OWNER: "You are not allowed to modify this review.",
    ALREADY_REVIEWED: "You have already reviewed this product.",
  },
  order: {
    cartEmpty: "Your cart is empty.",
    productNotFound: "A product in your cart no longer exists.",
    // For dynamic messages,We use a function!
    insufficientStock: (stock, name) => `Only ${stock} items left for ${name}.`,
    placedSuccessfully: "Order placed successfully.",
    redirectingStripe: "Redirecting to payment Gateway.",
    fetchedSuccessfully: "Orders fetched successfully.",
    cancelledSuccessfully: "Order cancelled successfully and stock restored.",
    statusUpdated: "Order status updated successfully.",
    notFound: "Order not found.",
    sellerNotFound: "Seller profile not found.",
    statusUpdatedSuccessfully: "Order status updated successfully.",
    sellerOrdersFetchedSuccessfully: "Seller orders fetched successfully.",
    alreadyProcessed: (status) =>
      `Cannot cancel order. It is already ${status}.`,
  },
};
