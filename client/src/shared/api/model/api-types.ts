export type ApiRequest = Record<string, unknown>;

export type ApiResponse = Record<string, unknown>;

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

export type ErrorResponse = {
  message: string;
  statusCode: number;
  error: string;
};
