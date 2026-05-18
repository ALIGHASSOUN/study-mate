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
    // لكن فقط إذا لم نكن بالفعل في صفحة login أو في طلب /me
    // وفقط إذا كان المستخدم مسجلاً دخوله فعلاً (يوجد cookie)
    if (error.response?.status === 401) {
      const url = error.config?.url || "";
      const isAuthEndpoint =
        url.includes("/auth/login") ||
        url.includes("/auth/verify-code") ||
        url.includes("/auth/me");

      // لا نعمل redirect تلقائي إلا إذا تأكدنا أن المستخدم كان مسجلاً
      // نتجنب الـ redirect من طلبات background أو طلبات اختيارية
      if (!isAuthEndpoint && !url.includes("/auth/logout")) {
        // بدلاً من redirect فوري، نحفظ في sessionStorage ونترك الـ /me يتعامل معه
        // هذا يمنع محو الفواتير والبيانات من الشاشة بشكل مفاجئ
        sessionStorage.setItem("auth_expired", "1");
        
        // نعطي وقت قصير للـ UI يعرض رسالة خطأ، ثم redirect
        setTimeout(() => {
          if (window.location.pathname !== "/login") {
            window.location.href = "/login";
          }
        }, 1500);
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
