import express from "express";
import {
  getQuiz,
  attemptQuiz,
  submitQuiz,
  getQuizResults,
  getStudentQuizHistory,
} from "../controllers/quizzesController.js";
import { authenticate, authorize } from "../middlewares/auth.js";

const router = express.Router();

router.use(authenticate);

router.get("/history", authorize("student"), getStudentQuizHistory);
router.get("/:id", getQuiz);
router.post("/:id/attempt", authorize("student"), attemptQuiz);
router.post("/:id/submit", authorize("student"), submitQuiz);
router.get(
  "/:id/results",
  authorize("student", "instructor", "admin"),
  getQuizResults
);

export default router;
