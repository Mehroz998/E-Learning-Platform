// API Base URL
export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// Course levels
export const COURSE_LEVELS = {
  BEGINNER: "beginner",
  INTERMEDIATE: "intermediate",
  ADVANCED: "advanced",
};

export const LEVEL_LABELS = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

// Course status
export const COURSE_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
  ARCHIVED: "archived",
};

// User roles
export const USER_ROLES = {
  STUDENT: "student",
  INSTRUCTOR: "instructor",
  ADMIN: "admin",
};

// Lesson content types
export const CONTENT_TYPES = {
  VIDEO: "video",
  TEXT: "text",
  QUIZ: "quiz",
  ASSIGNMENT: "assignment",
};

// Quiz answer options
export const QUIZ_OPTIONS = ["A", "B", "C", "D"];

// Default pagination
export const DEFAULT_PAGE_SIZE = 12;
