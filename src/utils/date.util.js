import ms from "ms";

// ============================================================
//                       DATE UTIL
// ============================================================

/**
 * @desc    Get expiry date from a duration string
 * @param   {string} duration - "15m", "7d", "24h"
 * @returns {Date} expiry date
 */
export const getExpiryDate = (duration) => {
  // 1. calculate and return expiry date from now
  return new Date(Date.now() + ms(duration));
};

// ------------------------------------------------------------

/**
 * @desc    Get start of current month (midnight)
 * @returns {Date} first day of current month at 00:00:00
 */
export const getStartOfMonth = () => {
  // 1. get current date
  const now = new Date();

  // 2. return first day of current month at midnight
  return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
};

// ------------------------------------------------------------

/**
 * @desc    Get start of a given day (midnight)
 * @param   {Date} date - Target date (default: today)
 * @returns {Date} given date at 00:00:00
 */
export const getStartOfDay = (date = new Date()) => {
  // 1. clone date to avoid mutating the original
  const d = new Date(date);

  // 2. set time to midnight and return
  d.setHours(0, 0, 0, 0);
  return d;
};
