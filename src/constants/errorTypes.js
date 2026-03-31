/**
 * @file errorTypes.js
 * @description Error type identifiers from third-party libraries and JS built-ins.
 */

// ─── JavaScript Built-in Errors ───────────────────────────────────────────────
export const JS_ERRORS = {
  SYNTAX: "SyntaxError", // invalid JSON.parse() input
  TYPE: "TypeError", // wrong type e.g. calling null as function
  REFERENCE: "ReferenceError", // accessing undefined variable
  RANGE: "RangeError", // value out of range e.g. invalid array length
};

// ─── Mongoose Errors ──────────────────────────────────────────────────────────
export const MONGOOSE_ERRORS = {
  CAST_ERROR: "CastError", // invalid ObjectId format e.g. /users/abc
  VALIDATION_ERROR: "ValidationError", // schema validation failed e.g. required field missing
  DUPLICATE_KEY: 11000, // unique field already exists e.g. duplicate email
};

// ─── JWT Errors ───────────────────────────────────────────────────────────────
export const JWT_ERRORS = {
  INVALID: "JsonWebTokenError", // malformed or tampered token
  EXPIRED: "TokenExpiredError", // token has passed its expiry time
};

// ─── Multer Errors (file uploads) ─────────────────────────────────────────────
export const MULTER_ERRORS = {
  LIMIT_FILE_SIZE: "LIMIT_FILE_SIZE", // file exceeds size limit
  LIMIT_FILE_COUNT: "LIMIT_FILE_COUNT", // too many files uploaded
  LIMIT_UNEXPECTED_FILE: "LIMIT_UNEXPECTED_FILE", // wrong field name
};

// ─── Nodemailer Errors (email sending) ────────────────────────────────────────
export const MAIL_ERRORS = {
  INVALID_RECIPIENT: "EENVELOPE", // invalid email address
  CONNECTION_FAILED: "ECONNECTION", // smtp server unreachable
  AUTH_FAILED: "EAUTH", // wrong smtp credentials
};

// ─── Stripe Errors (payments) ─────────────────────────────────────────────────
export const STRIPE_ERRORS = {
  CARD_DECLINED: "card_declined", // card was declined
  EXPIRED_CARD: "expired_card", // card has expired
  INCORRECT_CVC: "incorrect_cvc", // wrong CVC code
  INSUFFICIENT_FUNDS: "insufficient_funds", // not enough balance
};
