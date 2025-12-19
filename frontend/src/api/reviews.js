import axiosInstance from "./axios";

export const reviewsAPI = {
  // Update review (student/admin)
  updateReview: async (id, reviewData) => {
    const response = await axiosInstance.put(`/reviews/${id}`, reviewData);
    return response.data;
  },

  // Delete review (student/admin)
  deleteReview: async (id) => {
    const response = await axiosInstance.delete(`/reviews/${id}`);
    return response.data;
  },

  // Mark review as helpful
  markHelpful: async (id) => {
    const response = await axiosInstance.post(`/reviews/${id}/helpful`);
    return response.data;
  },
};
