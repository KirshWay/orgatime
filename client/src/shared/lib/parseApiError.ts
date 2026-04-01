import { isApiError } from '@/shared/api';

export const parseApiError = (error: unknown): string => {
  if (isApiError(error)) {
    const data = error.data as Record<string, unknown> | null;

    if (data?.message && Array.isArray(data.message)) {
      return data.message[0];
    }

    if (data?.message) {
      return data.message as string;
    }

    const status = error.status;

    if (status === 429) {
      return 'Too many attempts. Please try again later.';
    }

    if (status === 401) {
      return 'Invalid credentials or session expired';
    }

    if (status === 403) {
      return "You don't have access to this resource";
    }

    if (status === 404) {
      return 'The requested resource was not found';
    }

    if (status && status >= 500) {
      return 'Server error. Please try again later';
    }

    return error.message || 'An error occurred while processing your request';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unknown error occurred';
};
