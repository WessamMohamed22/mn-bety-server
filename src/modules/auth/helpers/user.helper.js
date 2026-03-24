// ============================================================
//                      USER HELPERS
// ============================================================

/**
 * @desc    Strip sensitive fields and return safe user data
 * @param   {Object} user - Mongoose user document
 * @returns {Object} safe user data
 */
export const safeUserData = (user) => {
  const { _id, fullName, email, phone, roles } = user;
  return { userId: _id, fullName, email, phone, roles };
};