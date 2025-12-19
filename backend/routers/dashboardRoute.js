import express from "express";
import {
  getStudentDashboard,
  getInstructorDashboard,
  getAdminDashboard,
} from "../controllers/dashboardController.js";
import { authenticate, authorize } from "../middlewares/auth.js";

const router = express.Router();

router.use(authenticate);

router.get("/admin", authorize("admin"), getAdminDashboard);

router.get(
  "/student",
  authorize("student", "instructor", "admin"),
  getStudentDashboard
);

router.get(
  "/instructor",
  authorize("instructor", "admin"),
  getInstructorDashboard
);

export default router;
