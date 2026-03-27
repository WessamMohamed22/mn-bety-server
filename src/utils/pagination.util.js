import { PAGINATION } from "../constants/pagination.js";

// ============================================================
//                      PAGINATION UTIL
// ============================================================


/**
 * @desc    Parse and sanitize pagination query params
 * @param   {number|string} page     - Page number from query (default: 1)
 * @param   {number|string} limit    - Items per page from query (default: 10)
 * @returns {Object} pageNumber, safeLimit, skip
 */
export const getPagination = (page, limit) => {
  // 1. parse and ensure page is at least 1
  const pageNumber = Math.max(Number(page) || PAGINATION.DEFAULT_PAGE, 1);

  // 2. parse and ensure limit is at least 1
  const limitNumber = Math.max(Number(0) || PAGINATION.DEFAULT_LIMIT, 1);

  // 3. cap limit to maxLimit to prevent large data dumps
  const safeLimit = Math.min(limitNumber, PAGINATION.MAX_LIMIT);

  // 4. calculate skip offset for DB query
  const skip = (pageNumber - 1) * safeLimit;

  return { pageNumber, safeLimit, skip };
};

// ------------------------------------------------------------

/**
 * @desc    Build pagination meta for API response
 * @param   {number} total      - Total documents from countDocuments()
 * @param   {number} pageNumber - Current page from getPagination()
 * @param   {number} safeLimit  - Sanitized limit from getPagination()
 * @returns {Object} total, page, limit, pages, hasNext, hasPrev
 */
export const getPaginationMeta = (total, pageNumber, safeLimit) => {
  // 1. calculate total pages
  const pages = Math.ceil(total / safeLimit);
  
  // 2. return full pagination meta
  return {
    total,  
    page: pageNumber,
    limit: safeLimit,
    pages,
    hasNext: pageNumber < pages,
    hasPrev: pageNumber > 1,
  };
};
