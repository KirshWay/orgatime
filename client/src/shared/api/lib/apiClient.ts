import axios from "axios";

export const apiClient = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("Error:", error);
    return Promise.reject(error);
  },
);
