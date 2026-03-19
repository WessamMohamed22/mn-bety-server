import Joi from "joi";
import validate from "../../utils/validate.util.js";

// ─── Reusable Validators ──────────────────────────────────────────────────────
const mongoId = Joi.string().hex().length(24);

// ─── Schemas ──────────────────────────────────────────────────────────────────
const schemas = {
  addToCart: Joi.object({
    productId: mongoId.required(),
    quantity: Joi.number().integer().min(1).default(1),
  }),

  updateQuantity: Joi.object({
    quantity: Joi.number().integer().min(1).required(),
  }),

  // Dynamic param schema — pass the param name e.g. params("productId")
  params: (name) =>
    Joi.object({
      [name]: mongoId.required(),
    }),
};

// ─── Exported Middleware ──────────────────────────────────────────────────────
export const validateAddToCart = validate(schemas.addToCart, "body");
export const validateUpdateQuantity = validate(schemas.updateQuantity, "body");
export const validateProductIdParam = validate(schemas.params("productId"), "params");
export const validateCartIdParam = validate(schemas.params("cartId"), "params");