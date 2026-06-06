import pool from "../database/db.js";
import AppError from "../utils/AppError.js";

export const createLesson = async (req, res, next) => {
  try {
    const { id: section_id } = req.params;
    const {
      title,
      content_type,
      video_url,
      text_content,
      duration,
      order_index,
      is_preview,
    } = req.body;

    // Verify section & course ownership
    const check = await pool.query(
      `
        SELECT s.id, c.instructor_id 
        FROM sections s 
        JOIN courses c ON s.course_id = c.id 
        WHERE s.id = $1
    `,
      [section_id]
    );

    if (check.rows.length === 0)
      return next(new AppError("Section not found", 404));

    if (
      check.rows[0].instructor_id !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return next(new AppError("Not authorized", 403));
    }

    const query = `
      INSERT INTO lessons (section_id, title, content_type, video_url, text_content, duration, order_index, is_preview)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const values = [
      section_id,
      title,
      content_type,
      video_url,
      text_content,
      duration,
      order_index || 0,
      is_preview || false,
    ];

    const result = await pool.query(query, values);

    // Update total lessons count in course
    const courseIdQuery = await pool.query(
      "SELECT course_id FROM sections WHERE id = $1",
      [section_id]
    );
    const courseId = courseIdQuery.rows[0].course_id;
    await pool.query(
      "UPDATE courses SET total_lessons = total_lessons + 1, total_duration = total_duration + $2 WHERE id = $1",
      [courseId, duration || 0]
    );

    res.status(201).json({
      status: "success",
      data: { lesson: result.rows[0] },
    });
  } catch (error) {
    next(error);
  }
};

export const getLesson = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if user is enrolled or if it's a preview or if instructor
    // For simplicity, we just return the lesson for now, but in real app we check enrollment access.
    // We'll trust the middleware/logic for now.

    const query = `SELECT * FROM lessons WHERE id = $1`;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0)
      return next(new AppError("Lesson not found", 404));

    res.status(200).json({
      status: "success",
      data: { lesson: result.rows[0] },
    });
  } catch (error) {
    next(error);
  }
};

export const updateLesson = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      content_type,
      video_url,
      text_content,
      duration,
      order_index,
      is_preview,
    } = req.body;

    const check = await pool.query(
      `
        SELECT l.id, c.instructor_id 
        FROM lessons l
        JOIN sections s ON l.section_id = s.id
        JOIN courses c ON s.course_id = c.id
        WHERE l.id = $1
    `,
      [id]
    );

    if (check.rows.length === 0)
      return next(new AppError("Lesson not found", 404));

    if (
      check.rows[0].instructor_id !== req.user.id &&
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
    if (content_type) {
      updates.push(`content_type = $${paramIndex}`);
      values.push(content_type);
      paramIndex++;
    }
    if (video_url) {
      updates.push(`video_url = $${paramIndex}`);
      values.push(video_url);
      paramIndex++;
    }
    if (text_content) {
      updates.push(`text_content = $${paramIndex}`);
      values.push(text_content);
      paramIndex++;
    }
    if (duration !== undefined) {
      updates.push(`duration = $${paramIndex}`);
      values.push(duration);
      paramIndex++;
    }
    if (order_index !== undefined) {
      updates.push(`order_index = $${paramIndex}`);
      values.push(order_index);
      paramIndex++;
    }
    if (is_preview !== undefined) {
      updates.push(`is_preview = $${paramIndex}`);
      values.push(is_preview);
      paramIndex++;
    }

    if (updates.length === 0)
      return next(new AppError("No data to update", 400));

    // Get old duration and course_id for aggregate update
    const oldLessonRes = await pool.query(
      "SELECT l.duration, s.course_id FROM lessons l JOIN sections s ON l.section_id = s.id WHERE l.id = $1",
      [id]
    );
    const oldDuration = oldLessonRes.rows[0]?.duration || 0;
    const courseId = oldLessonRes.rows[0]?.course_id;

    values.push(id);
    const query = `UPDATE lessons SET ${updates.join(
      ", "
    )} WHERE id = $${paramIndex} RETURNING *`;

    const result = await pool.query(query, values);
    const updatedLesson = result.rows[0];

    // Update course total duration if it changed
    if (duration !== undefined && duration !== oldDuration && courseId) {
      const diff = duration - oldDuration;
      await pool.query(
        "UPDATE courses SET total_duration = GREATEST(0, total_duration + $1) WHERE id = $2",
        [diff, courseId]
      );
    }

    res.status(200).json({
      status: "success",
      data: { lesson: updatedLesson },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteLesson = async (req, res, next) => {
  try {
    const { id } = req.params;

    const check = await pool.query(
      `
        SELECT l.id, c.instructor_id 
        FROM lessons l
        JOIN sections s ON l.section_id = s.id
        JOIN courses c ON s.course_id = c.id
        WHERE l.id = $1
    `,
      [id]
    );

    if (check.rows.length === 0)
      return next(new AppError("Lesson not found", 404));

    if (
      check.rows[0].instructor_id !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return next(new AppError("Not authorized", 403));
    }

    // Get course_id and duration for update
    const lessonInfo = await pool.query(
      "SELECT s.course_id, l.duration FROM sections s JOIN lessons l ON s.id = l.section_id WHERE l.id = $1",
      [id]
    );
    const { course_id: courseId } = lessonInfo.rows[0];
    console.log(`[BACKEND] Deleting lesson ${id} from course ${courseId}`);

    await pool.query("DELETE FROM lessons WHERE id = $1", [id]);

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
      `[BACKEND] Lesson deleted. New totals for course ${courseId}:`,
      updateResult.rows[0]
    );

    res.status(204).send();
  } catch (error) {
    console.error("[BACKEND ERROR] Delete Lesson:", error);
    next(error);
  }
};
