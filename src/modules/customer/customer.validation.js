import Joi from "joi";
import validate from "../../utils/validate.util.js";

const schemas = {
  updateMe: Joi.object({
    bio:     Joi.string().trim().max(500).allow(""),
    city:    Joi.string().trim().max(100).allow(""),
    address: Joi.string().trim().max(300).allow(""),
  }).min(1).messages({
    "object.min": "Provide at least one field to update.",
  }),
};

export const validateUpdateMe = validate(schemas.updateMe, "body");