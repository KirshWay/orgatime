import axios from "axios";

export const parseApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (
      error.response?.data?.message &&
      Array.isArray(error.response.data.message)
    ) {
      return error.response.data.message[0];
    }

    if (error.response?.data?.message) {
      return error.response.data.message;
    }

    const status = error.response?.status;

    if (status === 429) {
      return "Too many attempts. Please try again later.";
    }

    if (status === 401) {
      return "Invalid credentials or session expired";
    }

    if (status === 403) {
      return "You don't have access to this resource";
    }

    if (status === 404) {
      return "The requested resource was not found";
    }

    if (status && status >= 500) {
      return "Server error. Please try again later";
    }

    return error.message || "An error occurred while processing your request";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unknown error occurred";
};
