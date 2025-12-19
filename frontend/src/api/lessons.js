import axiosInstance from "./axios";

export const lessonsAPI = {
  // Get lesson by ID
  getLesson: async (id) => {
    const response = await axiosInstance.get(`/lessons/${id}`);
    return response.data;
  },

  // Update lesson (instructor/admin)
  updateLesson: async (id, lessonData) => {
    const response = await axiosInstance.put(`/lessons/${id}`, lessonData);
    return response.data;
  },

  // Delete lesson (instructor/admin)
  deleteLesson: async (id) => {
    const response = await axiosInstance.delete(`/lessons/${id}`);
    return response.data;
  },

  // Mark lesson as complete (student)
  markComplete: async (id) => {
    const response = await axiosInstance.post(`/lessons/${id}/complete`);
    return response.data;
  },

  // Get quiz for a lesson
  getQuiz: async (lessonId) => {
    const response = await axiosInstance.get(`/lessons/${lessonId}/quiz`);
    return response.data;
  },

  // Add quiz to lesson (instructor/admin)
  addQuiz: async (lessonId, quizData) => {
    const response = await axiosInstance.post(
      `/lessons/${lessonId}/quiz`,
      quizData
    );
    return response.data;
  },

  // Add assignment to lesson (instructor/admin)
  addAssignment: async (lessonId, assignmentData) => {
    const response = await axiosInstance.post(
      `/lessons/${lessonId}/assignment`,
      assignmentData
    );
    return response.data;
  },

  // Get assignment by lesson ID
  getAssignment: async (lessonId) => {
    const response = await axiosInstance.get(`/lessons/${lessonId}/assignment`);
    return response.data;
  },
};
