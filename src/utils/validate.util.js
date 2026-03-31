/**
 * @file validate.util.js
 * @description Shared Joi validation middleware factory.
 * Used across all modules to keep validation consistent and DRY.
 *
 * @usage validate(schema, "body") → returns an Express middleware
 */

/**
 * Creates an Express middleware that validates req[source] against a Joi schema.
 * @param {Object} schema  - Joi schema to validate against
 * @param {string} source  - Request property to validate: "body" | "params" | "query"
 * @returns {Function} Express middleware
 */
const validate = (schema, source = "body") => (req, res, next) => {
  const { error, value } = schema.validate(req[source], {
    abortEarly: false,   // collect all errors, not just the first
    stripUnknown: true,  // remove fields not in schema
    convert: true,       // coerce types e.g. "1" → 1
  });

  if (error)
    return res.status(422).json({
      errors: error.details.map((d) => ({
        field: d.path.join("."),
        message: d.message,
      })),
    });

  // Clear and re-assign to avoid replacing req[source] reference
  // (direct assignment crashes for query/params)
  Object.keys(req[source]).forEach((key) => delete req[source][key]);
  Object.assign(req[source], value);

  next();
};

export default validate;