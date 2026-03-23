import multer from "multer";
import { Readable } from "stream";
import cloudinary from "../config/cloudinary.js";
import asyncHandler from "./asyncHandler.js";
import { createBadRequestError } from "../errors/error.factory.js";
import { MESSAGES } from "../constants/messages.js";

// ============================================================
//                    UPLOAD MIDDLEWARE
//   Memory storage only — files never touch the local disk.
//   Each specific uploader streams the buffer to Cloudinary
//   and attaches the result to req.uploadedImage / req.uploadedFile
// ============================================================

// ─── Allowed types ────────────────────────────────────────────────────────────

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

// ─── Multer – memory storage ──────────────────────────────────────────────────

const memoryStorage = multer.memoryStorage();

const imageFileFilter = (req, file, cb) => {
  if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    return cb(createBadRequestError(MESSAGES.UPLOAD.INVALID_IMAGE_TYPE));
  }
  cb(null, true);
};

const multerImage = multer({
  storage: memoryStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

// ─── Core: stream buffer → Cloudinary ────────────────────────────────────────

/**
 * Upload a file buffer directly to Cloudinary via an upload stream.
 * No temp file is written to disk at any point.
 *
 * @param   {Buffer} buffer      - File buffer from multer memoryStorage
 * @param   {string} folder      - Cloudinary folder path
 * @param   {string} originalName - Original file name (used as public_id base)
 * @returns {Promise<{ url, publicId }>}
 */
const streamToCloudinary = (buffer, folder, originalName) => {
  return new Promise((resolve, reject) => {
    const publicId = `${Date.now()}-${originalName
      .split(".")[0]
      .replace(/\s+/g, "-")}`;

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, public_id: publicId, resource_type: "image" },
      (error, result) => {
        if (error) return reject(createBadRequestError(MESSAGES.UPLOAD.CLOUDINARY_FAILED));
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );

    // Convert buffer to readable stream and pipe into Cloudinary
    Readable.from(buffer).pipe(uploadStream);
  });
};

// ─── Delete from Cloudinary ───────────────────────────────────────────────────

/**
 * Remove an asset from Cloudinary by its publicId.
 * Returns true on success, false on failure (non-throwing).
 *
 * @param   {string} publicId
 * @returns {Promise<boolean>}
 */
export const deleteFromCloudinary = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch {
    return false;
  }
};

// ============================================================
//              SPECIFIC UPLOAD MIDDLEWARES
// Each is a small pipeline: multer parse → cloudinary upload
// ============================================================

/**
 * @desc  Upload a single category image to Cloudinary
 * @attaches req.uploadedImage = { url, publicId }
 * @field   categoryImage
 */
export const uploadCategoryImage = [
  // Step 1 – parse multipart, hold file in memory
  multerImage.single("categoryImage"),

  // Step 2 – stream buffer to Cloudinary (skip if no file sent)
  asyncHandler(async (req, res, next) => {
    if (!req.file) return next(); // image is optional on updates

    req.uploadedImage = await streamToCloudinary(
      req.file.buffer,
      "categories",          // Cloudinary folder
      req.file.originalname
    );

    next();
  }),
];



//* ==================================================================

/**
 * @desc  Upload multiple product images to Cloudinary (max 5)
 * @attaches req.uploadedImages = [{ url, publicId }]
 * @field   productImages
 */
export const uploadProductImages = [
  // Step 1 – parse multipart, hold files in memory
  (req, res, next) => {
    multerImage.array("productImages", 5)(req, res, (err) => {
      if (err) return next(err);
      next();
    });
  },

  // Step 2 – stream each buffer to Cloudinary
  asyncHandler(async (req, res, next) => {
    if (!req.files || req.files.length === 0) return next();

    req.uploadedImages = await Promise.all(
      req.files.map((file) =>
        streamToCloudinary(file.buffer, "products", file.originalname)
      )
    );

    next();
  }),
  
];
// ------------------------------------------------------------

/**
 * @desc  Upload a single avatar image to Cloudinary
 * @attaches req.uploadedImage = { url, publicId }
 * @field   avatar
 */
export const uploadAvatarImage = [
  multerImage.single("avatar"),

  asyncHandler(async (req, res, next) => {
    if (!req.file) return next();

    req.uploadedImage = await streamToCloudinary(
      req.file.buffer,
      "avatars",
      req.file.originalname
    );

    next();
  }),
];