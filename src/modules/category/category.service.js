import slugify from "slugify";
import Category from "../../DB/models/category.model.js";
import { MESSAGES } from "../../constants/messages.js";
import {
  createBadRequestError,
  createConflictError,
  createNotFoundError,
} from "../../errors/error.factory.js";

// ============================================================
//                    CATEGORY SERVICE
// ============================================================

/**
 * Recursively build a nested tree from a flat category list.
 * @param   {Array}  categories - Flat array of Category documents
 * @param   {*}      parentId   - Current parent (_id or null for roots)
 * @returns {Array}  Nested tree
 */
const buildTree = (categories, parentId = null) => {
  return categories
    .filter((cat) => String(cat.parent ?? null) === String(parentId))
    .map((cat) => ({
      ...cat.toObject(),
      children: buildTree(categories, cat._id),
    }));
};

// ------------------------------------------------------------

/**
 * @desc    Generate a unique slug from a name
 * @param   {string}  name        - Category name
 * @param   {string}  [excludeId] - Exclude this _id when checking conflicts (update)
 * @returns {string}  Unique slug
 */
const generateUniqueSlug = async (name, excludeId = null) => {
  let slug = slugify(name, { lower: true, strict: true });

  const query = { slug };
  if (excludeId) query._id = { $ne: excludeId };

  const conflict = await Category.findOne(query).exec();
  if (conflict) slug = `${slug}-${Date.now()}`;

  return slug;
};

// ============================================================
//                        CRUD
// ============================================================

/**
 * @desc    Create a new category
 * @param   {Object} data         - { name, parent, order, isActive }
 * @param   {Object} [uploadedImage] - { url, publicId } from upload middleware
 * @returns {Object} Saved category document
 */
export const createCategory = async (data, uploadedImage = null) => {
  const { name, parent, order, isActive } = data;

  // 1. Check name uniqueness
  const nameExists = await Category.findOne({
    name: name.toLowerCase().trim(),
  }).exec();
  if (nameExists) throw createConflictError(MESSAGES.CATEGORY.NAME_ALREADY_EXISTS);

  // 2. Validate parent if provided
  if (parent) {
    const parentExists = await Category.findById(parent).exec();
    if (!parentExists) throw createBadRequestError(MESSAGES.CATEGORY.PARENT_NOT_FOUND);
  }

  // 3. Generate unique slug
  const slug = await generateUniqueSlug(name);

  // 4. Build image object
  const image = {
    url: uploadedImage?.url ?? "",
    publicId: uploadedImage?.publicId ?? "",
  };

  // 5. Create & save
  const category = await Category.create({
    name,
    slug,
    image,
    parent: parent ?? null,
    order: order ?? 0,
    isActive: isActive ?? true,
  });

  return category;
};

// ------------------------------------------------------------

/**
 * @desc    Get all categories – flat list or nested tree
 * @param   {Object} options - { active?: "true"|"false", tree?: "true" }
 * @returns {Array}  Category list or tree
 */
export const getAllCategories = async ({ active, tree } = {}) => {
  const filter = {};
  if (active === "true") filter.isActive = true;
  if (active === "false") filter.isActive = false;

  const categories = await Category.find(filter)
    .populate("parent", "name slug")
    .sort({ order: 1, createdAt: 1 })
    .exec();

  if (tree === "true") return buildTree(categories);

  return categories;
};

// ------------------------------------------------------------

/**
 * @desc    Get a single category by Mongo _id or slug
 * @param   {string} idOrSlug - Mongo ObjectId string or slug
 * @returns {Object} Category document
 */
export const getCategoryByIdOrSlug = async (idOrSlug) => {
  const isObjectId = /^[a-f\d]{24}$/i.test(idOrSlug);
  const query = isObjectId ? { _id: idOrSlug } : { slug: idOrSlug };

  const category = await Category.findOne(query)
    .populate("parent", "name slug")
    .exec();

  if (!category) throw createNotFoundError(MESSAGES.CATEGORY.NOT_FOUND);

  return category;
};

// ------------------------------------------------------------

/**
 * @desc    Get direct children of a parent category
 * @param   {string} parentId - Parent category _id
 * @returns {Array}  Children documents
 */
export const getChildCategories = async (parentId) => {
  const parent = await Category.findById(parentId).exec();
  if (!parent) throw createNotFoundError(MESSAGES.CATEGORY.PARENT_NOT_FOUND);

  const children = await Category.find({ parent: parentId, isActive: true })
    .sort({ order: 1 })
    .exec();

  return children;
};

// ------------------------------------------------------------

/**
 * @desc    Update an existing category
 * @param   {string} id           - Category _id
 * @param   {Object} data         - { name?, parent?, order?, isActive? }
 * @param   {Object} [uploadedImage] - { url, publicId } from upload middleware
 * @returns {Object} Updated category document
 */
export const updateCategory = async (id, data, uploadedImage = null) => {
  const { name, parent, order, isActive } = data;

  // 1. Find existing category
  const category = await Category.findById(id).exec();
  if (!category) throw createNotFoundError(MESSAGES.CATEGORY.NOT_FOUND);

  // 2. Guard: category cannot be its own parent
  if (parent && String(parent) === String(id)) {
    throw createBadRequestError(MESSAGES.CATEGORY.SELF_PARENT);
  }

  // 3. Validate new parent
  if (parent) {
    const parentExists = await Category.findById(parent).exec();
    if (!parentExists) throw createBadRequestError(MESSAGES.CATEGORY.PARENT_NOT_FOUND);
  }

  // 4. Re-generate slug only when name actually changes
  if (name && name.toLowerCase().trim() !== category.name) {
    category.slug = await generateUniqueSlug(name, id);
    category.name = name;
  }

  // 5. Apply remaining fields
  if (parent !== undefined) category.parent = parent ?? null;
  if (order !== undefined) category.order = order;
  if (isActive !== undefined) category.isActive = isActive;

  // 6. Replace image only when a new file was uploaded
  if (uploadedImage) {
    category.image = {
      url: uploadedImage.url,
      publicId: uploadedImage.publicId,
    };
  }

  await category.save();
  return category;
};

// ------------------------------------------------------------

/**
 * @desc    Toggle isActive flag of a category
 * @param   {string} id - Category _id
 * @returns {Object} { isActive }
 */
export const toggleCategoryStatus = async (id) => {
  const category = await Category.findById(id).exec();
  if (!category) throw createNotFoundError(MESSAGES.CATEGORY.NOT_FOUND);

  category.isActive = !category.isActive;
  await category.save();

  return { isActive: category.isActive };
};

// ------------------------------------------------------------

/**
 * @desc    Delete a category – blocked when children exist
 * @param   {string} id - Category _id
 * @returns {void}
 */
export const deleteCategory = async (id) => {
  const category = await Category.findById(id).exec();
  if (!category) throw createNotFoundError(MESSAGES.CATEGORY.NOT_FOUND);

  const childrenCount = await Category.countDocuments({ parent: id });
  if (childrenCount > 0) {
    throw createBadRequestError(
      MESSAGES.CATEGORY.HAS_CHILDREN(childrenCount)
    );
  }

  await category.deleteOne();
};

// ------------------------------------------------------------

/**
 * @desc    Bulk-update the order field for multiple categories
 * @param   {Array} items - [{ id, order }, ...]
 * @returns {void}
 */
export const reorderCategories = async (items) => {
  const bulkOps = items.map(({ id, order }) => ({
    updateOne: {
      filter: { _id: id },
      update: { $set: { order } },
    },
  }));

  await Category.bulkWrite(bulkOps);
};