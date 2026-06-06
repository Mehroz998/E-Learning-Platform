import axiosInstance from "./axios";

export const quizzesAPI = {
  getQuiz: async (id) => {
    const response = await axiosInstance.get(`/quizzes/${id}`);
    return response.data;
  },
  attemptQuiz: async (id) => {
    const response = await axiosInstance.post(`/quizzes/${id}/attempt`);
    return response.data;
  },
  submitQuiz: async (id, answers) => {
    const response = await axiosInstance.post(`/quizzes/${id}/submit`, {
      answers,
    });
    return response.data;
  },
  getResults: async (id) => {
    const response = await axiosInstance.get(`/quizzes/${id}/results`);
    return response.data;
  },
  getStudentHistory: async () => {
    const response = await axiosInstance.get("/quizzes/history");
    return response.data;
  },
};
