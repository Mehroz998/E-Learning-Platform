import express from "express";
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoriesController.js";
import { authenticate, authorize } from "../middlewares/auth.js";

const router = express.Router();

//Get All CAtegories /api/categories
router.get("/", getAllCategories);
//Create Category /api/categories
router.post(
  "/",
  authenticate,
  authorize("admin", "instructor"),
  createCategory
);
//Get Category By ID /api/categories/:id
router.get("/:id", getCategoryById);
//Update Category /api/categories/:id
router.put(
  "/:id",
  authenticate,
  authorize("admin", "instructor"),
  updateCategory
);
//Delete Category /api/categories/:id
router.delete(
  "/:id",
  authenticate,
  authorize("admin", "instructor"),
  deleteCategory
);

export default router;
