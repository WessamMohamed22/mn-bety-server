import Joi from "joi";
import validate from "../../utils/validate.util.js";

const mongoId = Joi.string().hex().length(24).messages({
  "string.hex": "Invalid ID format",
  "string.length": "ID must be 24 chars",
});

const schemas = {
  addToWishlist: Joi.object({
    productId: mongoId.required(),
  }),
  params: (name) => Joi.object({ [name]: mongoId.required() }),
};

export const validateAddToWishlist = validate(schemas.addToWishlist, "body");
export const validateProductIdParam = validate(schemas.params("productId"), "params");