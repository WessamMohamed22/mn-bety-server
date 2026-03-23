import Joi from "joi";
import validate from "../../utils/validate.util.js";

// ─── Reusable Bits ────────────────────────────────────────────────────────────
const mongoId = Joi.string().hex().length(24).messages({
  "string.hex": "Invalid ID format",
  "string.length": "ID must be 24 chars",
});

// ─── Shared Category Fields ───────────────────────────────────────────────────
const categoryBase = {
  name: Joi.string().trim().min(2).max(60),
  parent: mongoId.allow(null, ""),
  order: Joi.number().integer().min(0),
  isActive: Joi.boolean(),
};

// ─── Schemas ──────────────────────────────────────────────────────────────────
const schemas = {
  // name is required on create, optional on update
  create: Joi.object({ ...categoryBase, name: categoryBase.name.required() }),
  update: Joi.object(categoryBase),

  // Dynamic param schema — pass the param name e.g. params("parentId")
  params: (name) => Joi.object({ [name]: mongoId.required() }),

  // Allow unknown query params (e.g. pagination added later)
  query: Joi.object({ active: Joi.boolean(), tree: Joi.boolean() }).unknown(),

  reorder: Joi.object({
    items: Joi.array()
      .items(
        Joi.object({
          id: mongoId.required(),
          order: Joi.number().required(),
        })
      )
      .min(1)
      .required(),
  }),
};

// ─── Exported Validators ──────────────────────────────────────────────────────
export const validateCreateCategory = validate(schemas.create, "body");

// Update needs both params (id) and body validation
export const validateUpdateCategory = [
  validate(schemas.params("id"), "params"),
  validate(schemas.update, "body"),
];

// Factory — call with param name e.g. validateMongoIdParam("parentId")
export const validateMongoIdParam = (name = "id") =>
  validate(schemas.params(name), "params");

export const validateGetAllQuery = validate(schemas.query, "query");
export const validateReorder = validate(schemas.reorder, "body");