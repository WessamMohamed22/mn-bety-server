import Joi from "joi";
import validate from "../../utils/validate.util.js";

// ─── Reusable Bits ────────────────────────────────────────────────────────────
const mongoId = Joi.string().hex().length(24).messages({
  "string.hex": "Invalid ID format",
  "string.length": "ID must be 24 chars",
});

// ─── Schemas ──────────────────────────────────────────────────────────────────
const schemas = {
  create: Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    description: Joi.string().trim().min(10).max(2000).required(),
    price: Joi.number().min(0).required(),
    discountPrice: Joi.number().min(0).default(0)
      .when("price", {
        is: Joi.number().greater(0),
        then: Joi.number().less(Joi.ref("price"))
          .messages({ "number.less": "Discount price must be less than the original price" }),
      }),
    stock: Joi.number().integer().min(0).required(),
    category: mongoId.required(),
  }),

  update: Joi.object({
    name: Joi.string().trim().min(2).max(100),
    description: Joi.string().trim().min(10).max(2000),
    price: Joi.number().min(0),
     discountPrice: Joi.number().min(0)
      .when("price", {
        is: Joi.number().greater(0),
        then: Joi.number().less(Joi.ref("price"))
          .messages({ "number.less": "Discount price must be less than the original price" }),
      }),
    stock: Joi.number().integer().min(0),
    category: mongoId,
  }),

  // Dynamic param schema — pass the param name e.g. params("sellerId")
  params: (name) => Joi.object({ [name]: mongoId.required() }),

  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10),
    category: mongoId,
    seller: mongoId,
    minPrice: Joi.number().min(0),
    maxPrice: Joi.number().min(0),
    search: Joi.string().trim(),
    sort: Joi.string().valid(
      "price", "-price",
      "createdAt", "-createdAt",
      "rating", "-rating"
    ),
    featured: Joi.boolean(),
  }).unknown(),
};

// ─── Exported Validators ──────────────────────────────────────────────────────
export const validateCreateProduct = validate(schemas.create, "body");

// Update needs both params (id) and body validation
export const validateUpdateProduct = [
  validate(schemas.params("id"), "params"),
  validate(schemas.update, "body"),
];

// Factory — call with param name e.g. validateMongoIdParam("sellerId")
export const validateMongoIdParam = (name = "id") =>
  validate(schemas.params(name), "params");

export const validateProductQuery = validate(schemas.query, "query");