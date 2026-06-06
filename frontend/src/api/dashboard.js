import axiosInstance from "./axios";

export const dashboardAPI = {
  // Get student dashboard data
  getStudentDashboard: async () => {
    const response = await axiosInstance.get("/dashboard/student");
    return response.data;
  },

  // Get instructor dashboard data
  getInstructorDashboard: async () => {
    const response = await axiosInstance.get("/dashboard/instructor");
    return response.data;
  },
};
