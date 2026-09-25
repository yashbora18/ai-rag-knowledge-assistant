import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: API_BASE_URL.replace(/\/+$/, ""),
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});


api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(
      "rag-access-token"
    );

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => Promise.reject(error)
);


api.interceptors.response.use(
  (response) => response,

  (error) => {
    const status = error.response?.status;

    const requestUrl =
      error.config?.url || "";

    const isAuthRequest =
      requestUrl.startsWith("/auth/");

    if (
      status === 401 &&
      !isAuthRequest
    ) {
      localStorage.removeItem(
        "rag-access-token"
      );

      const currentPath =
        window.location.pathname;

      if (
        currentPath !== "/login" &&
        currentPath !== "/register"
      ) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);


export default api;