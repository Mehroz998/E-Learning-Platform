import axiosInstance from "./axios";

export const assignmentsAPI = {
  // Get assignment details
  getAssignment: async (id) => {
    const response = await axiosInstance.get(`/assignments/${id}`);
    return response.data;
  },

  // Submit assignment (student)
  submitAssignment: async (id, submissionData) => {
    const response = await axiosInstance.post(
      `/assignments/${id}/submit`,
      submissionData
    );
    return response.data;
  },

  // Create assignment (instructor)
  createAssignment: async (lessonId, data) => {
    const response = await axiosInstance.post(
      `/lessons/${lessonId}/assignment`,
      data
    );
    return response.data;
  },

  // Grade submission (instructor)
  gradeSubmission: async (submissionId, gradeData) => {
    const response = await axiosInstance.put(
      `/assignments/submissions/${submissionId}/grade`,
      gradeData
    );
    return response.data;
  },

  // Get submissions (instructor)
  getSubmissions: async (assignmentId) => {
    const response = await axiosInstance.get(
      `/assignments/${assignmentId}/submissions`
    );
    return response.data;
  },
};
