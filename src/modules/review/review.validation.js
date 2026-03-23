import Joi from "joi";
import validate from "../../utils/validate.util.js";

// ─── Reusable Bits ────────────────────────────────────────────────────────────
const mongoId = Joi.string().hex().length(24).messages({
  "string.hex":    "Invalid ID format",
  "string.length": "ID must be 24 chars",
});

// ─── Schemas ──────────────────────────────────────────────────────────────────
const schemas = {
  create: Joi.object({
    rating: Joi.number().integer().min(1).max(5).required().messages({
      "any.required":   "Rating is required.",
      "number.base":    "Rating must be a number.",
      "number.min":     "Rating must be at least 1.",
      "number.max":     "Rating must be at most 5.",
      "number.integer": "Rating must be a whole number.",
    }),

    comment: Joi.string().trim().max(1000).optional().messages({
      "string.max": "Comment must be at most 1000 characters.",
    }),
  }),

  update: Joi.object({
    rating: Joi.number().integer().min(1).max(5).optional().messages({
      "number.base":    "Rating must be a number.",
      "number.min":     "Rating must be at least 1.",
      "number.max":     "Rating must be at most 5.",
      "number.integer": "Rating must be a whole number.",
    }),

    comment: Joi.string().trim().max(1000).optional().messages({
      "string.max": "Comment must be at most 1000 characters.",
    }),
  }).min(1).messages({
    "object.min": "Provide at least rating or comment to update.",
  }),

  // Dynamic param schema — pass the param name e.g. params("reviewId")
  params: (name) => Joi.object({ [name]: mongoId.required() }),

  pagination: Joi.object({
    page:  Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10),
  }).unknown(),
};

// ─── Exported Validators ──────────────────────────────────────────────────────
export const validateCreateReview = validate(schemas.create, "body");

// Update needs both params (reviewId) and body validation
export const validateUpdateReview = [
  validate(schemas.params("reviewId"), "params"),
  validate(schemas.update, "body"),
];

// Factory — call with param name e.g. validateMongoIdParam("productId")
export const validateMongoIdParam = (name = "reviewId") =>
  validate(schemas.params(name), "params");

export const validatePagination = validate(schemas.pagination, "query");