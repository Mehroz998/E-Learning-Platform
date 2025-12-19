import axiosInstance from "./axios";

export const coursesAPI = {
  // Get all courses with filters
  getAllCourses: async (params = {}) => {
    const response = await axiosInstance.get("/courses", { params });
    return response.data;
  },

  // Get course by ID
  getCourseById: async (id) => {
    const response = await axiosInstance.get(`/courses/${id}`);
    return response.data;
  },

  // Get course curriculum
  getCourseCurriculum: async (id) => {
    const response = await axiosInstance.get(`/courses/${id}/curriculum`);
    return response.data;
  },

  // Create new course
  createCourse: async (courseData) => {
    const formData = new FormData();
    Object.keys(courseData).forEach((key) => {
      if (courseData[key] !== null && courseData[key] !== undefined) {
        formData.append(key, courseData[key]);
      }
    });

    const response = await axiosInstance.post("/courses", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // Update course
  updateCourse: async (id, courseData) => {
    const formData = new FormData();
    Object.keys(courseData).forEach((key) => {
      if (courseData[key] !== null && courseData[key] !== undefined) {
        formData.append(key, courseData[key]);
      }
    });

    const response = await axiosInstance.put(`/courses/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // Delete course
  deleteCourse: async (id) => {
    const response = await axiosInstance.delete(`/courses/${id}`);
    return response.data;
  },

  // Enroll in course
  enrollCourse: async (id) => {
    const response = await axiosInstance.post(`/courses/${id}/enroll`);
    return response.data;
  },

  // Get student's enrolled courses
  getMyCoursers: async () => {
    const response = await axiosInstance.get("/courses/my-courses");
    return response.data;
  },

  // Get instructor's teaching courses
  getMyTeachingCourses: async () => {
    const response = await axiosInstance.get("/courses/my-teaching");
    return response.data;
  },

  // Add section to course
  addSection: async (courseId, sectionData) => {
    const response = await axiosInstance.post(
      `/courses/${courseId}/sections`,
      sectionData
    );
    return response.data;
  },

  // Add review to course
  addReview: async (courseId, reviewData) => {
    const response = await axiosInstance.post(
      `/courses/${courseId}/reviews`,
      reviewData
    );
    return response.data;
  },

  // Get reviews for course
  getReviews: async (courseId) => {
    const response = await axiosInstance.get(`/courses/${courseId}/reviews`);
    return response.data;
  },

  // Get Certificate
  getCertificate: async (enrollmentId) => {
    const response = await axiosInstance.get(
      `/enrollments/${enrollmentId}/certificate`
    );
    return response.data;
  },
};
