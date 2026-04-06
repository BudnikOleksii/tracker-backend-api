interface PaginationQuery {
  page?: number;
  pageSize?: number;
}

interface PaginatedResult<T> {
  data: T[];
  total: number;
}

export interface PaginatedResponse<T> {
  object: 'list';
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export function buildPaginatedResponse<T>(
  query: PaginationQuery,
  result: PaginatedResult<T>,
): PaginatedResponse<T> {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 20;
  const totalPages = Math.ceil(result.total / pageSize);

  return {
    object: 'list' as const,
    data: result.data,
    total: result.total,
    page,
    pageSize,
    hasMore: page < totalPages,
  };
}
