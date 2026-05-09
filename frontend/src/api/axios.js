import axios from "axios";

// In production (same-origin deploy on Render): baseURL = "/api"
// In development (Vite proxy): baseURL = "/api"
// If deploying frontend separately: set VITE_API_URL=https://your-backend.onrender.com/api
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // On 401 (token expired/invalid), redirect to login
    if (error.response?.status === 401) {
      const url = error.config?.url || "";
      if (!url.includes("/auth/login") && !url.includes("/auth/me")) {
        localStorage.removeItem("auth_user");
        window.location.href = "/login";
      }
    }

    // On 429 (rate limited)
    if (error.response?.status === 429) {
      console.warn("Rate limited:", error.config?.url);
    }

    return Promise.reject(error);
  }
);

export default api;
