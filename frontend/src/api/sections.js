import axiosInstance from "./axios";

export const sectionsAPI = {
  // Update section (instructor/admin)
  updateSection: async (id, sectionData) => {
    const response = await axiosInstance.put(`/sections/${id}`, sectionData);
    return response.data;
  },

  // Delete section (instructor/admin)
  deleteSection: async (id) => {
    const response = await axiosInstance.delete(`/sections/${id}`);
    return response.data;
  },

  // Add lesson to section (instructor/admin)
  addLesson: async (sectionId, lessonData) => {
    const response = await axiosInstance.post(
      `/sections/${sectionId}/lessons`,
      lessonData
    );
    return response.data;
  },
};
