import express from "express";
import {
  updateSection,
  deleteSection,
} from "../controllers/sectionsController.js";
import { authenticate, authorize } from "../middlewares/auth.js";
import { createLesson } from "../controllers/lessonsController.js"; // Helper to add lesson to a section

const router = express.Router();

router.use(authenticate);

// Update Section /api/sections/:id
router.put("/:id", authorize("instructor", "admin"), updateSection);

// Delete Section /api/sections/:id
router.delete("/:id", authorize("instructor", "admin"), deleteSection);

// Add Lesson to Section /api/sections/:id/lessons
router.post("/:id/lessons", authorize("instructor", "admin"), createLesson);

export default router;
