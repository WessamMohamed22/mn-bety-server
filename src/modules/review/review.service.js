import mongoose from "mongoose";
import Review from "../../DB/models/review.model.js";
import Product from "../../DB/models/product.model.js";
import { MESSAGES } from "../../constants/messages.js";
import {
    createConflictError,
    createForbiddenError,
    createNotFoundError,
} from "../../errors/error.factory.js";
import Order from "../../DB/models/orderItem.model.js"; 


// ============================================================
//                      REVIEW SERVICE
// ============================================================

/**
 * @desc    Create a new review — one per user per product
 * @param   {string} userId
 * @param   {string} productId
 * @param   {Object} data      - { rating, comment }
 * @returns {Object} Saved review document
 */
export const createReview = async (userId, productId, data) => {
    // 1. check product exists
    const product = await Product.findById(productId).exec();
    if (!product) throw createNotFoundError(MESSAGES.PRODUCT.NOT_FOUND);

    // 2. prevent duplicate — one review per user per product
    const existing = await Review.findOne({ user: userId, product: productId }).exec();
    if (existing) throw createConflictError(MESSAGES.REVIEW.ALREADY_REVIEWED);

    // 3. create review
    const review = await Review.create({
        user: userId,
        product: productId,
        rating: data.rating,
        comment: data.comment,
    });

    // 4. sync product rating stats
    await recalcProductRating(productId);

    return review.populate("user", "fullName");
};

// ------------------------------------------------------------

/**
 * @desc    Get all reviews for a product with pagination
 * @param   {string} productId
 * @param   {Object} options   - { page, limit }
 * @returns {Object} { reviews, total, page, pages }
 */
export const getProductReviews = async (productId, { page = 1, limit = 10 } = {}) => {
  const product = await Product.findById(productId).exec();
  if (!product) throw createNotFoundError(MESSAGES.PRODUCT.NOT_FOUND);

  const total = await Review.countDocuments({ product: productId });
  const pages = Math.ceil(total / limit);

  // ✅ Guard — clamp page to last available page
  const safePage = Math.min(Number(page), pages || 1);
  const skip = (safePage - 1) * limit;

  const reviews = await Review.find({ product: productId })
    .populate("user", "fullName")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .exec();

  return {
    reviews,
    total,
    page: safePage,   // ← returns the actual page served, not what was requested
    pages,
  };
};

// ------------------------------------------------------------

/**
 * @desc    Get a single review by _id
 * @param   {string} reviewId
 * @returns {Object} Review document
 */
export const getReviewById = async (reviewId) => {
    const review = await Review.findById(reviewId)
        .populate("user", "fullName")
        .populate("product", "name slug")
        .exec();

    if (!review) throw createNotFoundError(MESSAGES.REVIEW.NOT_FOUND);
    return review;
};

// ------------------------------------------------------------

/**
 * @desc    Update own review (rating / comment)
 * @param   {string} reviewId
 * @param   {string} userId
 * @param   {Object} data     - { rating?, comment? }
 * @returns {Object} Updated review document
 */
export const updateReview = async (reviewId, userId, data) => {
    const review = await Review.findById(reviewId).exec();
    if (!review) throw createNotFoundError(MESSAGES.REVIEW.NOT_FOUND);

    // only the review owner can edit
    if (review.user.toString() !== userId.toString()) {
        throw createForbiddenError(MESSAGES.REVIEW.NOT_OWNER);
    }

    if (data.rating !== undefined) review.rating = data.rating;
    if (data.comment !== undefined) review.comment = data.comment;

    await review.save();

    // sync product rating stats
    await recalcProductRating(review.product.toString());

    return review.populate("user", "fullName");
};

// ------------------------------------------------------------

/**
 * @desc    Delete a review — owner or admin
 * @param   {string} reviewId
 * @param   {string} userId
 * @param   {Array}  roles
 * @returns {void}
 */
export const deleteReview = async (reviewId, userId, roles) => {
    const review = await Review.findById(reviewId).exec();
    if (!review) throw createNotFoundError(MESSAGES.REVIEW.NOT_FOUND);

    const isOwner = review.user.toString() === userId.toString();
    const isAdmin = roles.includes("admin");

    if (!isOwner && !isAdmin) {
        throw createForbiddenError(MESSAGES.REVIEW.NOT_OWNER);
    }

    const productId = review.product.toString();
    await review.deleteOne();

    // sync product rating stats after deletion
    await recalcProductRating(productId);
};

// ─── Internal helper ──────────────────────────────────────────────────────────

/**
 * Recalculate avgRating and ratingCount on the Product document.
 * Called after every create / update / delete.
 */
const recalcProductRating = async (productId) => {
    const result = await Review.aggregate([
        { $match: { product: new mongoose.Types.ObjectId(productId) } },
        {
            $group: {
                _id: "$product",
                avgRating: { $avg: "$rating" },
                count: { $sum: 1 },
            },
        },
    ]);

    await Product.findByIdAndUpdate(productId, {
        rating: result[0] ? Math.round(result[0].avgRating * 10) / 10 : 0,
        numReviews: result[0]?.count ?? 0,
    });
};


/**
 * @desc   Get platform-wide statistics for buyer and seller satisfaction
 * @returns {Object} { buyerSatisfaction, sellerSatisfaction }
 */
// controller/reviewController.js


export const getPlatformStatistics = async () => {
    // 1. حساب رضا المشتري من التقييمات
    const reviews = await Review.find();
    let buyerSatisfaction = 0;

    if (reviews && reviews.length > 0) {
        const totalRating = reviews.reduce((acc, item) => acc + item.rating, 0);
        const avgRating = totalRating / reviews.length;
        buyerSatisfaction = Math.round((avgRating / 5) * 100);
    }

    // 2. حساب رضا البائع من الأوردرات المكتملة
    const allOrders = await Order.find();
    let sellerSatisfaction = 0;

    if (allOrders && allOrders.length > 0) {
        // ✅ التعديل هنا: استخدمنا orderStatus لأنها المعرفة في السكيما الخاصة بكِ
        const completedOrders = allOrders.filter(order => order.orderStatus === 'delivered').length;
        
        // النسبة = (عدد الطلبات المكتملة / إجمالي الطلبات) * 100
        sellerSatisfaction = Math.round((completedOrders / allOrders.length) * 100);
    } else {
        // إذا لم يكن هناك طلبات بعد، نعطي نسبة 100% كبداية إيجابية للمنصة
        sellerSatisfaction = 100;
    }

    return {
        buyerSatisfaction: buyerSatisfaction || 0,
        sellerSatisfaction: sellerSatisfaction || 0
    };
};