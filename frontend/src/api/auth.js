import axiosInstance from "./axios";

export const authAPI = {
  // Register new user
  register: async (userData) => {
    const formData = new FormData();
    Object.keys(userData).forEach((key) => {
      if (userData[key] !== null && userData[key] !== undefined) {
        formData.append(key, userData[key]);
      }
    });

    const response = await axiosInstance.post("/auth/register", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // Login
  login: async (credentials) => {
    const response = await axiosInstance.post("/auth/login", credentials);
    return response.data;
  },

  // Logout
  logout: async (refreshToken) => {
    const response = await axiosInstance.post("/auth/logout", { refreshToken });
    return response.data;
  },

  // Get current user profile
  getMe: async () => {
    const response = await axiosInstance.get("/auth/getme");
    return response.data;
  },

  // Change password
  changePassword: async (passwords) => {
    const response = await axiosInstance.put(
      "/auth/change-password",
      passwords
    );
    return response.data;
  },

  // Refresh access token
  refreshToken: async (refreshToken) => {
    const response = await axiosInstance.post("/auth/refresh", {
      refreshToken,
    });
    return response.data;
  },
};
