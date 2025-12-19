import axiosInstance from "./axios";

export const progressAPI = {
  // Get course progress for an enrollment
  getCourseProgress: async (enrollmentId) => {
    const response = await axiosInstance.get(
      `/enrollments/${enrollmentId}/progress`
    );
    return response.data;
  },

  // Get certificate for completed course
  getCertificate: async (enrollmentId) => {
    const response = await axiosInstance.get(
      `/enrollments/${enrollmentId}/certificate`
    );
    return response.data;
  },
};
