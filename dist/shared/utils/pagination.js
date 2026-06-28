"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaginationParams = getPaginationParams;
exports.formatPaginatedResponse = formatPaginatedResponse;
function getPaginationParams(query) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.max(1, parseInt(query.limit) || 10);
    const search = typeof query.search === 'string' && query.search.trim() ? query.search.trim() : undefined;
    return { page, limit, search };
}
function formatPaginatedResponse(data, totalItems, page, limit) {
    const totalPages = Math.ceil(totalItems / limit);
    return {
        data,
        pagination: {
            page,
            limit,
            totalItems,
            totalPages,
            hasNext: page < totalPages,
            hasPrevious: page > 1,
        },
    };
}
