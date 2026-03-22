import Joi from "joi";
import validate from "../../utils/validate.util.js";

const mongoId = Joi.string().hex().length(24).messages({
  "string.hex":    "Invalid ID format",
  "string.length": "ID must be 24 chars",
});

const schemas = {
  // PUT /me
  updateMe: Joi.object({
    fullName: Joi.string().trim().min(2).max(100),
    bio:      Joi.string().trim().max(500).allow(""),
    phone:    Joi.string().trim().pattern(/^\+?[1-9]\d{9,14}$/).allow("").messages({
      "string.pattern.base": "Invalid phone number format",
    }),
    city:    Joi.string().trim().max(100).allow(""),
    address: Joi.string().trim().max(300).allow(""),
  }).min(1).messages({
    "object.min": "Provide at least one field to update.",
  }),

  // PUT /me/change-password
  changePassword: Joi.object({
    currentPassword: Joi.string().required().messages({
      "any.required": "Current password is required.",
    }),
    newPassword: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s])\S{8,}$/)
      .required()
      .messages({
        "any.required":        "New password is required.",
        "string.pattern.base": "Password must contain uppercase, lowercase, number and special character.",
      }),
  }),

  // GET / (admin)
  getAllQuery: Joi.object({
    page:   Joi.number().integer().min(1).default(1),
    limit:  Joi.number().integer().min(1).max(50).default(10),
    search: Joi.string().trim(),
  }).unknown(),

  params: (name) => Joi.object({ [name]: mongoId.required() }),
};

export const validateUpdateMe      = validate(schemas.updateMe,      "body");
export const validateChangePassword = validate(schemas.changePassword, "body");
export const validateGetAllQuery   = validate(schemas.getAllQuery,    "query");
export const validateMongoIdParam  = (name = "id") =>
  validate(schemas.params(name), "params");