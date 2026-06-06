import express from "express";
import {
  getCourseProgress,
  getCertificate,
} from "../controllers/progressController.js";
import { authenticate } from "../middlewares/auth.js";

const router = express.Router();

router.use(authenticate);

// /api/enrollments/:id/progress
router.get("/:id/progress", getCourseProgress);

// /api/enrollments/:id/certificate
router.get("/:id/certificate", getCertificate);

export default router;
