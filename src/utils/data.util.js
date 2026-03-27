// ============================================================
//                      DATA UTILITIES
// ============================================================

/**
 * @desc    Internal helper — converts a string to its correct data type
 * @param   {*}  val  - The raw value to cast
 * @returns {boolean|number|string}  - The value in its correct type
 */
const castValue = (val) => {
  // 1. Not a string — already typed (number, boolean, etc.), return as is
  if (typeof val !== "string") return val;

  const trimmed = val.trim();

  // 2. Convert "true" / "false" strings to real booleans
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;

  // 3. Convert numeric strings to actual numbers
  if (trimmed !== "" && !isNaN(trimmed)) return Number(trimmed);

  // 4. return trimmed
  return trimmed;
};

// ------------------------------------------------------------

/**
 * @desc    Parse URL query strings into correct data types]
 * @param   {Object}   rawQuery       - The raw query object from req.query
 * @param   {string[]} allowedFields  - Whitelist of accepted field names
 * @returns {Object}                  - Clean filter object with typed values
 */
export const parseQuery = (rawQuery, allowedFields = []) => {
  // 1. check if no qurey
  if (!rawQuery) return {};
  
  // 1. Loop through allowed fields only
  const filter = {};
  
  allowedFields.forEach((key) => {
    const value = rawQuery[key];

    // 2. Skip missing or empty values
    if (value === undefined || value === "") return;

    // 3. if create arrays
    if (Array.isArray(value)) {
      filter[key] = value.map(castValue);
      return;
    }

    // 4. Cast the value to its correct type and store it
    filter[key] = castValue(value);
  });

  return filter;
};

// ------------------------------------------------------------

/**
 * @desc    Pick specific fields from the request body
 * @note    Allows null and "" so users can intentionally clear a field
 * @param   {Object}   rawBody        - The raw body object from req.body
 * @param   {string[]} allowedFields  - Whitelist of accepted field names
 * @returns {Object}                  - Clean updates object with only allowed fields
 */
export const pickFields = (rawBody, allowedFields = []) => {
  const updates = {};

  // 1. Only pick what's explicitly allowed
  allowedFields.forEach((key) => {
    const value = rawBody[key];

    // 2. Skip fields the user didn't send at all
    if (value === "" || value === undefined) return;

    // 3. Cast the value — trims strings, keeps null/booleans/numbers
    updates[key] = castValue(value);
  });

  return updates;
};
