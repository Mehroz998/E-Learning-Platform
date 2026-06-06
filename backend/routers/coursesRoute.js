import express from "express";
import {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  enrollCourse,
  getCourseCurriculum,
  getStudentCourses,
  getMyTeachingCourses,
} from "../controllers/coursesController.js";
import { authenticate, authorize } from "../middlewares/auth.js";
import {
  createReview,
  getCourseReviews,
} from "../controllers/reviewsController.js";
import { createSection } from "../controllers/sectionsController.js";

import upload from "../middlewares/multer.js";
const router = express.Router();

//All Courses /api/courses
router.get("/", getAllCourses);

// My Teaching Courses /api/courses/my-teaching
router.get(
  "/my-teaching",
  authenticate,
  authorize("instructor", "admin"),
  getMyTeachingCourses
);

// Student Courses /api/courses/my-courses
router.get(
  "/my-courses",
  authenticate,
  authorize("student", "instructor", "admin"),
  getStudentCourses
);

// Courses by ID /api/courses/:id
router.get("/:id", getCourseById);
// Courses Curriculum /api/courses/:id/curriculum
router.get("/:id/curriculum", getCourseCurriculum);

// Create a new course /api/courses
router.post(
  "/",
  authenticate,
  authorize("instructor", "admin"),
  upload.single("thumbnail"),
  createCourse
);

// Reviews /api/courses/:id/reviews
router.get("/:id/reviews", getCourseReviews);
router.post(
  "/:id/reviews",
  authenticate,
  authorize("student", "admin"),
  createReview
);

// Update a course /api/courses/:id
router.put(
  "/:id",
  authenticate,
  authorize("instructor", "admin"),
  upload.single("thumbnail"),
  updateCourse
);

// Delete a course /api/courses/:id
router.delete(
  "/:id",
  authenticate,
  authorize("instructor", "admin"),
  deleteCourse
);

// Add Section to Course
router.post(
  "/:id/sections",
  authenticate,
  authorize("instructor", "admin"),
  createSection
);

// Enroll in Course
router.post(
  "/:id/enroll",
  authenticate,
  authorize("student", "admin"),
  enrollCourse
);

export default router;
