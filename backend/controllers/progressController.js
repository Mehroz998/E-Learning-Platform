import pool from "../database/db.js";
import AppError from "../utils/AppError.js";

export const markLessonComplete = async (req, res, next) => {
  try {
    const { id: lesson_id } = req.params;
    const student_id = req.user.id;

    // Find enrollment
    // We need to find enrollment_id first.
    // Lesson -> Section -> Course -> Enrollment
    const findEnrollment = await pool.query(
      `
        SELECT 
          e.id as enrollment_id, 
          c.id as course_id,
          (SELECT COUNT(*) FROM lessons l2 
           JOIN sections s2 ON l2.section_id = s2.id 
           WHERE s2.course_id = c.id) as total_lessons
        FROM lessons l
        JOIN sections s ON l.section_id = s.id
        JOIN courses c ON s.course_id = c.id
        JOIN enrollments e ON c.id = e.course_id
        WHERE l.id = $1 AND e.student_id = $2
    `,
      [lesson_id, student_id]
    );

    if (findEnrollment.rows.length === 0)
      return next(new AppError("Enrollment not found or lesson invalid", 404));

    const enrollment_id = findEnrollment.rows[0].enrollment_id;
    const total_lessons = parseInt(findEnrollment.rows[0].total_lessons);

    // Mark complete
    const query = `
        INSERT INTO lesson_progress (enrollment_id, lesson_id, completed, completed_at)
        VALUES ($1, $2, true, NOW())
        ON CONFLICT (enrollment_id, lesson_id) DO UPDATE SET completed = true, completed_at = NOW()
        RETURNING *
    `;
    await pool.query(query, [enrollment_id, lesson_id]);

    // Update Course Progress %
    const countCompleted = await pool.query(
      "SELECT COUNT(*) FROM lesson_progress WHERE enrollment_id = $1 AND completed = true",
      [enrollment_id]
    );
    const completedCount = parseInt(countCompleted.rows[0].count);

    // Avoid division by zero
    const progressPercent =
      total_lessons > 0
        ? Math.round((completedCount / total_lessons) * 100)
        : 0;

    const updateEnrollment = `
        UPDATE enrollments 
        SET progress = $1, completed_at = $2
        WHERE id = $3
        RETURNING *
    `;
    const completed_at = progressPercent === 100 ? new Date() : null;

    const result = await pool.query(updateEnrollment, [
      progressPercent,
      completed_at,
      enrollment_id,
    ]);

    res.status(200).json({
      status: "success",
      data: { progress: progressPercent, enrollment: result.rows[0] },
    });
  } catch (error) {
    next(error);
  }
};

export const getCourseProgress = async (req, res, next) => {
  try {
    const { id: enrollment_id } = req.params;
    const student_id = req.user.id;

    // Verify ownership
    const verify = await pool.query(
      "SELECT * FROM enrollments WHERE id = $1 AND student_id = $2",
      [enrollment_id, student_id]
    );
    if (verify.rows.length === 0)
      return next(new AppError("Enrollment not found", 404));

    const progressRes = await pool.query(
      "SELECT * FROM lesson_progress WHERE enrollment_id = $1",
      [enrollment_id]
    );

    res.status(200).json({
      status: "success",
      data: {
        enrollment: verify.rows[0],
        lesson_progress: progressRes.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getCertificate = async (req, res, next) => {
  try {
    const { id: enrollment_id } = req.params;
    const student_id = req.user.id;

    const verify = await pool.query(
      `
            SELECT e.*, c.title as course_title, u.name as student_name
            FROM enrollments e
            JOIN courses c ON e.course_id = c.id
            JOIN users u ON e.student_id = u.id
            WHERE e.id = $1 AND e.student_id = $2
        `,
      [enrollment_id, student_id]
    );

    if (verify.rows.length === 0)
      return next(new AppError("Enrollment not found", 404));

    const enrollment = verify.rows[0];

    if (enrollment.progress < 100) {
      return next(new AppError("Course not completed yet", 400));
    }

    // Generate Mock Certificate URL or Data
    // In real app, we might generate PDF.
    const certificateData = {
      id: `CERT-${enrollment.id}-${Date.now()}`,
      course: enrollment.course_title,
      student: enrollment.student_name,
      date: enrollment.completed_at,
      url: `https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf`, // Real public PDF for testing
    };

    res
      .status(200)
      .json({ status: "success", data: { certificate: certificateData } });
  } catch (error) {
    next(error);
  }
};
