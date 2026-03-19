/**
  Wraps an async route handler to automatically catch errors
  and forward them to error handler middleware.

  @param {Function} routeHandler - Express route handler (req, res, next)
  @returns {Function} Wrapped handler with error catching
*/

export default function asyncHandler(routeHandler) {
  return async function (req, res, next) {
    try {
      await routeHandler(req, res, next);
    } catch (error) {
      next(error); // Forward error to global error handler
    }
  };
}
