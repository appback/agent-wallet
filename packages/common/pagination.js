function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

function paginatedResponse(rows, total, { page, limit }) {
  return {
    data: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

function formatPaginatedResponse(data, total, page, limit) {
  return paginatedResponse(data, total, { page, limit });
}

module.exports = { parsePagination, paginatedResponse, formatPaginatedResponse };
