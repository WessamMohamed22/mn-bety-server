import Joi from "joi";
import validate from "../../utils/validate.util.js";

const mongoId = Joi.string().hex().length(24).messages({
  "string.hex":    "Invalid ID format",
  "string.length": "ID must be 24 chars",
});

const schemas = {
  updateProfile: Joi.object({
    description: Joi.string().trim().max(1000).allow(""),
    location: Joi.object({
      country: Joi.string().trim().max(100).allow(""),
      city:    Joi.string().trim().max(100).allow(""),
      address: Joi.string().trim().max(300).allow(""),
    }),
    bankInfo: Joi.object({
      bankName:      Joi.string().trim().max(100).allow(""),
      accountName:   Joi.string().trim().max(100).allow(""),
      accountNumber: Joi.string().trim().max(50).allow(""),
      iban:          Joi.string().trim().max(50).allow(""),
    }),
  }).min(1).messages({
    "object.min": "Provide at least one field to update.",
  }),

  getAllQuery: Joi.object({
    page:   Joi.number().integer().min(1).default(1),
    limit:  Joi.number().integer().min(1).max(50).default(10),
    search: Joi.string().trim(),
  }).unknown(),

  params: (name) => Joi.object({ [name]: mongoId.required() }),
};

export const validateUpdateProfile = validate(schemas.updateProfile, "body");
export const validateGetAllQuery   = validate(schemas.getAllQuery,    "query");
export const validateMongoIdParam  = (name = "id") =>
  validate(schemas.params(name), "params");