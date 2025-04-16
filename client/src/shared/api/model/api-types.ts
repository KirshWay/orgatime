export type ApiRequest = Record<string, unknown>;

export type ApiResponse = Record<string, unknown>;

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ErrorResponse {
  message: string;
  statusCode: number;
  error: string;
}
