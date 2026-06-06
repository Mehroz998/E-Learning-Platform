import { createContext, useState, useEffect, useContext } from "react";
import { authAPI } from "../api/auth";
import toast from "react-hot-toast";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth from localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const auth = JSON.parse(localStorage.getItem("auth") || "{}");

        if (auth.accessToken) {
          // Verify token is still valid by fetching user data
          const response = await authAPI.getMe();
          setUser(response.data);
        }
      } catch (error) {
        // Token invalid, clear auth
        localStorage.removeItem("auth");
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);

      const { user: userData, tokens } = response;

      // Store tokens
      localStorage.setItem("auth", JSON.stringify(tokens));

      // Set user
      setUser(userData);

      toast.success("Login successful!");
      return { success: true, user: userData };
    } catch (error) {
      const message = error.response?.data?.message || "Login failed";
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      toast.success("Registration successful! Please login.");
      return { success: true, data: response };
    } catch (error) {
      const message = error.response?.data?.message || "Registration failed";
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      const auth = JSON.parse(localStorage.getItem("auth") || "{}");

      if (auth.refreshToken) {
        await authAPI.logout(auth.refreshToken);
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Always clear local state
      localStorage.removeItem("auth");
      setUser(null);
      toast.success("Logged out successfully");
    }
  };

  const updateProfile = async () => {
    try {
      const response = await authAPI.getMe();
      setUser(response.data);
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user,
    isStudent: user?.role === "student",
    isInstructor: user?.role === "instructor",
    isAdmin: user?.role === "admin",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export default AuthContext;
