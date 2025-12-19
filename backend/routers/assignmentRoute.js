import express from "express";
import {
  getAssignment,
  submitAssignment,
  gradeSubmission,
  getAssignmentSubmissions,
} from "../controllers/assignmentController.js";
import { authenticate, authorize } from "../middlewares/auth.js";

const router = express.Router();

router.use(authenticate);

// Get Assignment details
router.get("/:id", getAssignment);

// Get All Submissions (Instructor)
router.get(
  "/:id/submissions",
  authorize("instructor", "admin"),
  getAssignmentSubmissions
);

// Student submit
router.post("/:id/submit", authorize("student"), submitAssignment);

//Grade Submission (Instructor)
router.put("/submissions/:id/grade", authorize("instructor"), gradeSubmission);

export default router;
