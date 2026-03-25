import Joi from "joi";
import validate from "../../utils/validate.util.js";

const mongoId = Joi.string().hex().length(24);

const schemas = {
  checkout: Joi.object({
    paymentMethod: Joi.string().valid("COD", "Stripe").required(),
    shippingAddress: Joi.object({
      street: Joi.string().required(),
      city: Joi.string().required(),
      country: Joi.string().required(),
      postalCode: Joi.string().required(),
    }).required(),
  }),

  updateStatus: Joi.object({
    orderStatus: Joi.string()
      .valid("pending", "processing", "shipped", "delivered", "cancelled")
      .required(),
  }),

  params: (name) => Joi.object({ [name]: mongoId.required() }),
};

export const validateCheckout = validate(schemas.checkout, "body");
export const validateUpdateStatus = validate(schemas.updateStatus, "body");
export const validateOrderIdParam = validate(schemas.params("orderId"), "params");