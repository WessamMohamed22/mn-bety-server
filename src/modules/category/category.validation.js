import Joi from "joi";

// ─── Reusable Bits ──────────────────────────────────────────────────────────
const mongoId = Joi.string().hex().length(24).messages({ "string.hex": "Invalid ID format", "string.length": "ID must be 24 chars" });

const categoryBase = {
  name: Joi.string().trim().min(2).max(60),
  parent: mongoId.allow(null, ""),
  order: Joi.number().integer().min(0),
  isActive: Joi.boolean()
};

// ─── Schemas ────────────────────────────────────────────────────────────────
const schemas = {
  create: Joi.object({ ...categoryBase, name: categoryBase.name.required() }),
  update: Joi.object(categoryBase),
  params: (name) => Joi.object({ [name]: mongoId.required() }),
  query: Joi.object({ active: Joi.boolean(), tree: Joi.boolean() }).unknown(),
  reorder: Joi.object({
    items: Joi.array().items(Joi.object({ id: mongoId.required(), order: Joi.number().required() })).min(1).required()
  })
};

// ─── Fixed Middleware Factory ───────────────────────────────────────────────
const validate = (schema, source = "body") => (req, res, next) => {
  const target = typeof schema === "function" ? schema(Object.keys(req[source])[0]) : schema;
  const { error, value } = target.validate(req[source], { abortEarly: false, stripUnknown: true, convert: true });

  if (error) return res.status(422).json({ errors: error.details.map(d => ({ field: d.path.join("."), message: d.message })) });

  // FIX: Instead of req[source] = value (which crashes query/params), 
  // we clear and re-assign properties to the existing object.
  Object.keys(req[source]).forEach(key => delete req[source][key]);
  Object.assign(req[source], value);
  
  next();
};

// ─── Exported Validators ────────────────────────────────────────────────────
export const validateCreateCategory = validate(schemas.create, "body");
export const validateUpdateCategory = [validate(schemas.params("id"), "params"), validate(schemas.update, "body")];
export const validateMongoIdParam = (name = "id") => validate(schemas.params(name), "params");
export const validateGetAllQuery = validate(schemas.query, "query");
export const validateReorder = validate(schemas.reorder, "body");