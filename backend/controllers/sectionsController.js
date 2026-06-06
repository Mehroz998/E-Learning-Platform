import pool from "../database/db.js";
import AppError from "../utils/AppError.js";

export const createSection = async (req, res, next) => {
  try {
    const { id: course_id } = req.params;
    const { title, description, order_index } = req.body;

    // Verify course ownership
    const courseCheck = await pool.query(
      "SELECT instructor_id FROM courses WHERE id = $1",
      [course_id]
    );
    if (courseCheck.rows.length === 0)
      return next(new AppError("Course not found", 404));

    if (
      courseCheck.rows[0].instructor_id !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return next(
        new AppError("Not authorized to add sections to this course", 403)
      );
    }

    const query = `
      INSERT INTO sections (course_id, title, description, order_index)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const result = await pool.query(query, [
      course_id,
      title,
      description,
      order_index || 0,
    ]);

    res.status(201).json({
      status: "success",
      data: { section: result.rows[0] },
    });
  } catch (error) {
    res.json({
      status: "error",
      message: "Failed to create section",
      error: error,
    });
  }
};

export const updateSection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, order_index } = req.body;

    // Check section existence and course ownership
    const sectionCheck = await pool.query(
      `
        SELECT s.*, c.instructor_id 
        FROM sections s 
        JOIN courses c ON s.course_id = c.id 
        WHERE s.id = $1
    `,
      [id]
    );

    if (sectionCheck.rows.length === 0)
      return next(new AppError("Section not found", 404));

    if (
      sectionCheck.rows[0].instructor_id !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return next(new AppError("Not authorized", 403));
    }

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (title) {
      updates.push(`title = $${paramIndex}`);
      values.push(title);
      paramIndex++;
    }
    if (description) {
      updates.push(`description = $${paramIndex}`);
      values.push(description);
      paramIndex++;
    }
    if (order_index !== undefined) {
      updates.push(`order_index = $${paramIndex}`);
      values.push(order_index);
      paramIndex++;
    }

    if (updates.length === 0)
      return next(new AppError("No data to update", 400));

    values.push(id);
    const query = `UPDATE sections SET ${updates.join(
      ", "
    )} WHERE id = $${paramIndex} RETURNING *`;

    const result = await pool.query(query, values);

    res.status(200).json({
      status: "success",
      data: { section: result.rows[0] },
    });
  } catch (error) {
    res.json({
      status: "error",
      message: "Failed to update section",
      error: error,
    });
  }
};

export const deleteSection = async (req, res, next) => {
  try {
    const { id } = req.params;

    const sectionCheck = await pool.query(
      `
        SELECT s.id, s.course_id, c.instructor_id 
        FROM sections s 
        JOIN courses c ON s.course_id = c.id 
        WHERE s.id = $1
    `,
      [id]
    );

    if (sectionCheck.rows.length === 0)
      return next(new AppError("Section not found", 404));

    if (
      sectionCheck.rows[0].instructor_id !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return next(new AppError("Not authorized", 403));
    }

    const courseId = sectionCheck.rows[0].course_id;
    console.log(`[BACKEND] Deleting section ${id} from course ${courseId}`);

    await pool.query("DELETE FROM sections WHERE id = $1", [id]);

    // Recalculate course totals
    const updateResult = await pool.query(
      `
      UPDATE courses 
      SET 
        total_lessons = (SELECT COUNT(l.id) FROM lessons l JOIN sections s ON l.section_id = s.id WHERE s.course_id = $1),
        total_duration = (SELECT COALESCE(SUM(l.duration), 0) FROM lessons l JOIN sections s ON l.section_id = s.id WHERE s.course_id = $1)
      WHERE id = $1
      RETURNING total_lessons, total_duration
      `,
      [courseId]
    );

    console.log(
      `[BACKEND] Section deleted. New totals for course ${courseId}:`,
      updateResult.rows[0]
    );

    res.status(204).send();
  } catch (error) {
    console.error("[BACKEND ERROR] Delete Section:", error);
    next(error);
  }
};
