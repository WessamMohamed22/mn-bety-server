import Joi from "joi";

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
    discountPrice: Joi.number().min(0).default(0),
    stock: Joi.number().integer().min(0).required(),
    category: mongoId.required(),
  }),

  update: Joi.object({
    name: Joi.string().trim().min(2).max(100),
    description: Joi.string().trim().min(10).max(2000),
    price: Joi.number().min(0),
    discountPrice: Joi.number().min(0),
    stock: Joi.number().integer().min(0),
    category: mongoId,
  }),

  params: (name) => Joi.object({ [name]: mongoId.required() }),

  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10),
    category: mongoId,
    seller: mongoId,
    minPrice: Joi.number().min(0),
    maxPrice: Joi.number().min(0),
    search: Joi.string().trim(),
    sort: Joi.string().valid("price", "-price", "createdAt", "-createdAt", "rating", "-rating"),
    featured: Joi.boolean(),
  }).unknown(),
};

// ─── Middleware Factory ────────────────────────────────────────────────────────
const validate = (schema, source = "body") => (req, res, next) => {
  const target =
    typeof schema === "function"
      ? schema(Object.keys(req[source])[0])
      : schema;

  const { error, value } = target.validate(req[source], {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });

  if (error)
    return res.status(422).json({
      errors: error.details.map((d) => ({
        field: d.path.join("."),
        message: d.message,
      })),
    });

  Object.keys(req[source]).forEach((key) => delete req[source][key]);
  Object.assign(req[source], value);

  next();
};

// ─── Exported Validators ──────────────────────────────────────────────────────
export const validateCreateProduct = validate(schemas.create, "body");
export const validateUpdateProduct = [
  validate(schemas.params("id"), "params"),
  validate(schemas.update, "body"),
];
export const validateMongoIdParam = (name = "id") =>
  validate(schemas.params(name), "params");
export const validateProductQuery = validate(schemas.query, "query");