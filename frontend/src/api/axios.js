import axios from "axios";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const auth = JSON.parse(localStorage.getItem("auth") || "{}");
    if (auth.accessToken) {
      config.headers.Authorization = `Bearer ${auth.accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const auth = JSON.parse(localStorage.getItem("auth") || "{}");

        if (auth.refreshToken) {
          // Try to refresh token
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken: auth.refreshToken,
          });

          const { accessToken, refreshToken } = response.data.data.tokens;

          // Update stored tokens
          const newAuth = { ...auth, accessToken, refreshToken };
          localStorage.setItem("auth", JSON.stringify(newAuth));

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return axiosInstance(originalRequest);
        } else {
          // No refresh token - user is not logged in
          // Don't show error toast or redirect for public endpoints
          // Just return the error silently
          return Promise.reject(error);
        }
      } catch (refreshError) {
        // Refresh failed, clear auth and redirect to login
        localStorage.removeItem("auth");
        // Only redirect if we actually had a token (user was logged in)
        const hadToken = JSON.parse(
          localStorage.getItem("auth") || "{}"
        ).accessToken;
        if (hadToken) {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors (but not 401 for public routes)
    // Only show toast if it's not a 401 or if user was actually logged in
    const auth = JSON.parse(localStorage.getItem("auth") || "{}");
    if (error.response?.status !== 401 || auth.accessToken) {
      const message = error.response?.data?.message || "An error occurred";
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
