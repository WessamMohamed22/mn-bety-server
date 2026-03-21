import slugify from "slugify";
import Product from "../../DB/models/product.model.js";
import Seller from "../../DB/models/saller.model.js";
import Category from "../../DB/models/category.model.js";
import { MESSAGES } from "../../constants/messages.js";
import {
  createBadRequestError,
  createForbiddenError,
  createNotFoundError,
} from "../../errors/error.factory.js";

// ─── Helper: generate unique slug ─────────────────────────────────────────────
const generateUniqueSlug = async (name, excludeId = null) => {
  let slug = slugify(name, { lower: true, strict: true });

  const query = { slug };
  if (excludeId) query._id = { $ne: excludeId };

  const conflict = await Product.findOne(query).exec();
  if (conflict) slug = `${slug}-${Date.now()}`;

  return slug;
};

// ─── Helper: ensure category is a leaf (has no children) ──────────────────────
const ensureLeafCategory = async (categoryId) => {
  const category = await Category.findById(categoryId).exec();
  if (!category) throw createNotFoundError(MESSAGES.CATEGORY.NOT_FOUND);

  const childrenCount = await Category.countDocuments({ parent: categoryId });
  if (childrenCount > 0)
    throw createBadRequestError(MESSAGES.PRODUCT.PARENT_CATEGORY_NOT_ALLOWED);

  return category;
};

// ─── Helper: get category IDs (self + all children) ───────────────────────────
const getCategoryWithChildren = async (categoryId) => {
  // get all direct children
  const children = await Category.find({ parent: categoryId }).select("_id").exec();
  
  // if no children, just return the category itself
  if (children.length === 0) return [categoryId];
  
  // recursively get children of children
  const childIds = await Promise.all(
    children.map((child) => getCategoryWithChildren(child._id))
  );
  
  // flatten and include self
  return [categoryId, ...childIds.flat()];
};

// ─── Create Product ───────────────────────────────────────────────────────────
/**
 * @desc    Create a new product under the authenticated seller
 * @param   {Object} data         - Validated body fields
 * @param   {Array}  images       - [{ url, publicId }] from upload middleware
 * @param   {string} userId       - Decoded userId from JWT
 * @returns {Object} Saved product document
 */
export const createProduct = async (data, images = [], userId) => {
  // 1. find seller profile linked to this user
  const seller = await Seller.findOne({ user: userId }).exec();
  if (!seller) throw createBadRequestError(MESSAGES.SELLER.NOT_FOUND);

  // 2. ensure category is a leaf
  const category = await ensureLeafCategory(data.category);

  // 3. generate unique slug
  const slug = await generateUniqueSlug(data.name);

  // 4. create & save product
  const product = await Product.create({
    ...data,
    slug,
    images,
    seller: seller._id,
    isApproved: false, // requires admin approval
  });

  return product;
};

// ─── Get All Products ─────────────────────────────────────────────────────────
/**
 * @desc    Get all approved & active products with filters and pagination
 * @param   {Object} query - { page, limit, category, seller, minPrice, maxPrice, search, sort, featured }
 * @returns {Object} { products, total, page, pages }
 */
export const getAllProducts = async (query) => {
  const {
    page = 1,
    limit = 10,
    category,
    seller,
    minPrice,
    maxPrice,
    search,
    sort = "-createdAt",
    featured,
  } = query;

  // 1. build filter — public only sees approved + active products
  const filter = { isApproved: true, isActive: true };

   if (category) {
    const categoryIds = await getCategoryWithChildren(category);
    filter.category = { $in: categoryIds };
  }
  if (seller) filter.seller = seller;
  if (featured !== undefined) filter.isFeatured = featured;
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = minPrice;
    if (maxPrice !== undefined) filter.price.$lte = maxPrice;
  }
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  // 2. pagination
  const skip = (page - 1) * limit;
  const total = await Product.countDocuments(filter);

  // 3. fetch
  const products = await Product.find(filter)
    .populate("category", "name slug")
    .populate("seller", "user rating")
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .exec();

  return {
    products,
    total,
    page: Number(page),
    pages: Math.ceil(total / limit),
  };
};

// ─── Get Single Product ───────────────────────────────────────────────────────
/**
 * @desc    Get a single product by Mongo _id or slug
 * @param   {string} idOrSlug
 * @returns {Object} Product document
 */
export const getProductByIdOrSlug = async (idOrSlug) => {
  const isObjectId = /^[a-f\d]{24}$/i.test(idOrSlug);
  const query = isObjectId ? { _id: idOrSlug } : { slug: idOrSlug };

  const product = await Product.findOne(query)
    .populate("category", "name slug")
    .populate("seller", "user rating")
    .exec();

  if (!product) throw createNotFoundError(MESSAGES.PRODUCT.NOT_FOUND);

  return product;
};

// ─── Get Seller Products ──────────────────────────────────────────────────────
/**
 * @desc    Get all products belonging to a specific seller
 * @param   {string} sellerId
 * @returns {Array} Product documents
 */
export const getSellerProducts = async (sellerId) => {
  const seller = await Seller.findById(sellerId).exec();
  if (!seller) throw createNotFoundError(MESSAGES.SELLER.NOT_FOUND);

  const products = await Product.find({ seller: sellerId })
    .populate("category", "name slug")
    .sort({ createdAt: -1 })
    .exec();

  return products;
};

// ─── Update Product ───────────────────────────────────────────────────────────
/**
 * @desc    Update product — seller can only update their own products
 * @param   {string} id       - Product _id
 * @param   {Object} data     - Updated fields
 * @param   {Array}  images   - New images from upload middleware (optional)
 * @param   {string} userId   - Decoded userId from JWT
 * @returns {Object} Updated product document
 */
export const updateProduct = async (id, data, images = [], userId) => {
  // 1. find product
  const product = await Product.findById(id).exec();
  if (!product) throw createNotFoundError(MESSAGES.PRODUCT.NOT_FOUND);

  // 2. verify ownership — seller can only edit their own products
  const seller = await Seller.findOne({ user: userId }).exec();
  if (!seller || String(product.seller) !== String(seller._id)) {
    throw createForbiddenError(MESSAGES.PRODUCT.NOT_OWNER);
  }

  // 3. if category is being changed, ensure new one is a leaf ← NEW
  if (data.category && String(data.category) !== String(product.category)) {
    await ensureLeafCategory(data.category);
  }

  // 4. re-generate slug only when name changes
  if (data.name && data.name.toLowerCase().trim() !== product.name) {
    product.slug = await generateUniqueSlug(data.name, id);
    product.name = data.name;
    delete data.name;
  }

  // 5. apply remaining fields
  Object.assign(product, data);

  // 6. append new images if uploaded
  if (images.length > 0) {
    product.images.push(...images);
  }

  await product.save();
  return product;
};

// ─── Delete Product ───────────────────────────────────────────────────────────
/**
 * @desc    Delete product — seller (owner) or admin
 * @param   {string} id     - Product _id
 * @param   {string} userId - Decoded userId from JWT
 * @param   {Array}  roles  - Decoded roles from JWT
 * @returns {void}
 */
export const deleteProduct = async (id, userId, roles) => {
  const product = await Product.findById(id).exec();
  if (!product) throw createNotFoundError(MESSAGES.PRODUCT.NOT_FOUND);

  // admin can delete any product
  if (!roles.includes("admin")) {
    // seller can only delete their own
    const seller = await Seller.findOne({ user: userId }).exec();
    if (!seller || String(product.seller) !== String(seller._id)) {
      throw createForbiddenError(MESSAGES.PRODUCT.NOT_OWNER);
    }
  }

  await product.deleteOne();
};

// ─── Toggle Active Status ─────────────────────────────────────────────────────
/**
 * @desc    Toggle isActive — seller (owner) or admin
 * @param   {string} id     - Product _id
 * @param   {string} userId - Decoded userId from JWT
 * @param   {Array}  roles  - Decoded roles from JWT
 * @returns {Object} { isActive }
 */
export const toggleProductStatus = async (id, userId, roles) => {
  const product = await Product.findById(id).exec();
  if (!product) throw createNotFoundError(MESSAGES.PRODUCT.NOT_FOUND);

  if (!roles.includes("admin")) {
    const seller = await Seller.findOne({ user: userId }).exec();
    if (!seller || String(product.seller) !== String(seller._id)) {
      throw createForbiddenError(MESSAGES.PRODUCT.NOT_OWNER);
    }
  }

  product.isActive = !product.isActive;
  await product.save();

  return { isActive: product.isActive };
};

// ─── Approve Product ──────────────────────────────────────────────────────────
/**
 * @desc    Approve product — admin only
 * @param   {string} id - Product _id
 * @returns {Object} { isApproved }
 */
export const approveProduct = async (id) => {
  const product = await Product.findById(id).exec();
  if (!product) throw createNotFoundError(MESSAGES.PRODUCT.NOT_FOUND);

  product.isApproved = true;
  await product.save();

  return { isApproved: product.isApproved };
};