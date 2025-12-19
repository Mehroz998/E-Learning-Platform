import express from "express";
import {
  createReview,
  updateReview,
  deleteReview,
  markHelpful,
} from "../controllers/reviewsController.js";
import { authenticate, authorize } from "../middlewares/auth.js";

const router = express.Router();

router.use(authenticate);

router.put("/:id", authorize("student", "admin"), updateReview);
router.delete("/:id", authorize("student", "admin"), deleteReview);
router.post("/:id/helpful", markHelpful); // /api/reviews/:id/helpful

export default router;
