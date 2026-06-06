import pool from "../database/db.js";
import AppError from "../utils/AppError.js";

// Create Review
export const createReview = async (req, res, next) => {
  try {
    const { id: course_id } = req.params;
    const { rating, review } = req.body;
    const student_id = req.user.id;

    // Check enrollment (Ideally only enrolled students review)
    // Check duplication (UNIQUE constraint handles it, but nice to check nice)

    // Simple check if course exists
    const courseCheck = await pool.query(
      "SELECT id FROM courses WHERE id = $1",
      [course_id]
    );
    if (courseCheck.rows.length === 0)
      return next(new AppError("Course not found", 404));

    const checkEnrollment = await pool.query(
      "SELECT id FROM enrollments WHERE student_id = $1 AND course_id = $2",
      [student_id, course_id]
    );
    if (checkEnrollment.rows.length === 0 && req.user.role !== "admin") {
      return next(new AppError("You must buy the course to review it", 403));
    }

    const query = `
        INSERT INTO reviews (course_id, student_id, rating, review)
        VALUES ($1, $2, $3, $4)
        RETURNING *
    `;
    const result = await pool.query(query, [
      course_id,
      student_id,
      rating,
      review,
    ]);

    // Update Average Rating
    // Trigger or manual update? Manual for simplicity.
    const avgResult = await pool.query(
      "SELECT AVG(rating) as avg_rating FROM reviews WHERE course_id = $1",
      [course_id]
    );
    const newAvg = parseFloat(avgResult.rows[0].avg_rating).toFixed(2);
    await pool.query("UPDATE courses SET average_rating = $1 WHERE id = $2", [
      newAvg,
      course_id,
    ]);

    res
      .status(201)
      .json({ status: "success", data: { review: result.rows[0] } });
  } catch (error) {
    if (error.code === "23505") {
      // Unique constraint violation
      return next(new AppError("You have already reviewed this course", 400));
    }
    next(error);
  }
};

export const updateReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, review } = req.body;
    const student_id = req.user.id; // or admin

    const check = await pool.query("SELECT * FROM reviews WHERE id = $1", [id]);
    if (check.rows.length === 0)
      return next(new AppError("Review not found", 404));

    if (check.rows[0].student_id !== student_id && req.user.role !== "admin") {
      return next(new AppError("Not authorized", 403));
    }

    const query = `
            UPDATE reviews 
            SET rating = COALESCE($1, rating), review = COALESCE($2, review), updated_at = NOW()
            WHERE id = $3
            RETURNING *
        `;
    const result = await pool.query(query, [rating, review, id]);

    // Update Avg Rating
    const course_id = check.rows[0].course_id;
    const avgResult = await pool.query(
      "SELECT AVG(rating) as avg_rating FROM reviews WHERE course_id = $1",
      [course_id]
    );
    const newAvg = parseFloat(avgResult.rows[0].avg_rating).toFixed(2);
    await pool.query("UPDATE courses SET average_rating = $1 WHERE id = $2", [
      newAvg,
      course_id,
    ]);

    res
      .status(200)
      .json({ status: "success", data: { review: result.rows[0] } });
  } catch (error) {
    next(error);
  }
};

export const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const student_id = req.user.id;

    const check = await pool.query("SELECT * FROM reviews WHERE id = $1", [id]);
    if (check.rows.length === 0)
      return next(new AppError("Review not found", 404));

    if (check.rows[0].student_id !== student_id && req.user.role !== "admin") {
      return next(new AppError("Not authorized", 403));
    }

    const course_id = check.rows[0].course_id;
    await pool.query("DELETE FROM reviews WHERE id = $1", [id]);

    // Update Avg Rating
    const avgResult = await pool.query(
      "SELECT AVG(rating) as avg_rating FROM reviews WHERE course_id = $1",
      [course_id]
    );
    const newAvg = avgResult.rows[0].avg_rating
      ? parseFloat(avgResult.rows[0].avg_rating).toFixed(2)
      : 0;
    await pool.query("UPDATE courses SET average_rating = $1 WHERE id = $2", [
      newAvg,
      course_id,
    ]);

    res.status(204).json({ status: "success", data: null });
  } catch (error) {
    next(error);
  }
};

export const markHelpful = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Ideally we track WHO marked helpful to prevent spam, but schema only has helpful_count.
    // So we just increment.

    await pool.query(
      "UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = $1",
      [id]
    );

    res.status(200).json({ status: "success", message: "Marked as helpful" });
  } catch (error) {
    next(error);
  }
};

export const getCourseReviews = async (req, res, next) => {
  try {
    const { id: course_id } = req.params;

    const query = `
      SELECT r.*, u.name as student_name, u.avatar as student_avatar
      FROM reviews r
      JOIN users u ON r.student_id = u.id
      WHERE r.course_id = $1
      ORDER BY r.created_at DESC
    `;
    const result = await pool.query(query, [course_id]);

    res.status(200).json({
      status: "success",
      results: result.rows.length,
      data: {
        reviews: result.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};
