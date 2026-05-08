import axios from "axios";

// In dev: Vite proxy forwards /api/* to http://localhost:5000
// In prod: set VITE_API_BASE_URL to your deployed backend URL
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token to every request
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("skillxchange_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401: clear token + redirect to login
axiosInstance.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("skillxchange_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
