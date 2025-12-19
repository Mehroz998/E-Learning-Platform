import express from "express";
import {
  getLesson,
  updateLesson,
  deleteLesson,
} from "../controllers/lessonsController.js";
import { authenticate, authorize } from "../middlewares/auth.js";
import {
  getQuiz,
  getQuizByLesson,
  attemptQuiz,
  submitQuiz,
  getQuizResults,
  createQuiz,
} from "../controllers/quizzesController.js";
import {
  createAssignment,
  getAssignmentByLesson,
} from "../controllers/assignmentController.js";
import { markLessonComplete } from "../controllers/progressController.js"; // Will exist soon

const router = express.Router();

router.use(authenticate);

// Get Lesson (logic inside controller should ideally handle permission, or we assume enrolled)
router.get("/:id", getLesson);

// Update/Delete
router.put("/:id", authorize("instructor", "admin"), updateLesson);
router.delete("/:id", authorize("instructor", "admin"), deleteLesson);

// Sub-resources under lessons
// We will need to import these controllers (they will be created next)
// For now I will import them assuming they will exist, or comment them out if it breaks build but user asked for implementation so I must create them.
// I will rely on sequential creation.

// Mark Complete
router.post("/:id/complete", markLessonComplete);

// Assessments under lesson
router.get("/:id/quiz", getQuizByLesson);
router.post("/:id/quiz", authorize("instructor", "admin"), createQuiz);

router.post(
  "/:id/assignment",
  authorize("instructor", "admin"),
  createAssignment
);

router.get("/:id/assignment", getAssignmentByLesson);

export default router;
