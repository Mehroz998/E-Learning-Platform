import pool from "../database/db.js";
import AppError from "../utils/AppError.js";

// Helper to create slug (if needed later for category slugs)
// For now, names are unique so we might just use ID.

// GetAll Categories
export const getAllCategories = async (req, res, next) => {
  try {
    const query = "SELECT * FROM categories ORDER BY created_at DESC";
    const result = await pool.query(query);

    res.status(200).json({
      status: "success",
      results: result.rows.length,
      data: {
        categories: result.rows,
      },
    });
  } catch (error) {
    res.json({
      status: "error",
      message: "Failed to get categories",
      error: error.message,
    });
  }
};

// Get Category By ID
export const getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const query = "SELECT * FROM categories WHERE id = $1";
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return next(new AppError("Category not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        category: result.rows[0],
      },
    });
  } catch (error) {
    res.json({
      status: "error",
      message: "Failed to get category",
      error: error.message,
    });
  }
};

// Create Category
export const createCategory = async (req, res, next) => {
  try {
    const { name, description, icon } = req.body;

    if (!name) {
      return next(new AppError("Category name is required", 400));
    }

    // Check if category already exists
    const checkQuery = "SELECT id FROM categories WHERE name = $1";
    const checkResult = await pool.query(checkQuery, [name]);

    if (checkResult.rows.length > 0) {
      return next(new AppError("Category with this name already exists", 400));
    }

    const query = `
            INSERT INTO categories (name, description, icon)
            VALUES ($1, $2, $3)
            RETURNING *
        `;
    const result = await pool.query(query, [name, description, icon]);

    res.status(201).json({
      status: "success",
      data: {
        category: result.rows[0],
      },
    });
  } catch (error) {
    res.json({
      status: "error",
      message: "Failed to create category",
      error: error.message,
    });
  }
};

// Update Category
export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, icon } = req.body;

    // Check if category exists
    const checkQuery = "SELECT * FROM categories WHERE id = $1";
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return next(new AppError("Category not found", 404));
    }

    // Dynamic update
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (name) {
      updates.push(`name = $${paramIndex}`);
      values.push(name);
      paramIndex++;
    }
    if (description) {
      updates.push(`description = $${paramIndex}`);
      values.push(description);
      paramIndex++;
    }
    if (icon) {
      updates.push(`icon = $${paramIndex}`);
      values.push(icon);
      paramIndex++;
    }

    if (updates.length === 0) {
      return next(new AppError("No data to update", 400));
    }

    values.push(id);
    const query = `
            UPDATE categories
            SET ${updates.join(", ")}
            WHERE id = $${paramIndex}
            RETURNING *
        `;

    const result = await pool.query(query, values);

    res.status(200).json({
      status: "success",
      data: {
        category: result.rows[0],
      },
    });
  } catch (error) {
    res.json({
      status: "error",
      message: "Failed to update category",
      error: error.message,
    });
  }
};

// Delete Category
export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check existence
    const checkQuery = "SELECT id FROM categories WHERE id = $1";
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return next(new AppError("Category not found", 404));
    }

    // Check relations (courses) before delete if needed, but schema might not CASCADE or we might want to restrict
    // Schema in setup.js: category_id INTEGER REFERENCES categories(id) -> No ON DELETE specified, so it defaults to NO ACTION (error if children exist)
    // Actually typically we want to prevent deleting a category if it has courses.
    const courseCheck = "SELECT id FROM courses WHERE category_id = $1";
    const courseResult = await pool.query(courseCheck, [id]);

    if (courseResult.rows.length > 0) {
      return next(
        new AppError(
          "Cannot delete category with associated courses. Please reassign or delete the courses first.",
          400
        )
      );
    }

    const result = await pool.query(
      "DELETE FROM categories WHERE id = $1 RETURNING *",
      [id]
    );

    res.status(204).json({
      status: "success",
      data: result.rows[0],
    });
  } catch (error) {
    res.json({
      status: "error",
      message: "Failed to delete category",
      error: error.message,
    });
  }
};
