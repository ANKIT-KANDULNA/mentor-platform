/**
 * Parses query parameters and returns pagination offsets and limits for Prisma queries.
 * @param {object} query - Express request query object
 * @returns {object} - Pagination parameters { page, limit, skip, take }
 */
const getPagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(query.limit) || 10));
  const skip = (page - 1) * limit;
  const take = limit;

  return {
    page,
    limit,
    skip,
    take,
  };
};

module.exports = { getPagination };
