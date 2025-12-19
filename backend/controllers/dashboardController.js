import pool from "../database/db.js";
import AppError from "../utils/AppError.js";

export const getStudentDashboard = async (req, res, next) => {
  try {
    const student_id = req.user.id;

    // Stats: Enrolled Courses count, Completed Courses count, Active Courses count
    const statsQuery = `
        SELECT 
            COUNT(*) as total_enrolled,
            COUNT(CASE WHEN progress = 100 THEN 1 END) as completed_courses,
            COUNT(CASE WHEN progress < 100 THEN 1 END) as active_courses
        FROM enrollments
        WHERE student_id = $1
    `;
    const statsResult = await pool.query(statsQuery, [student_id]);

    // Recent Courses
    const recentQuery = `
        SELECT c.id, c.title, c.thumbnail, e.progress, e.enrolled_at 
        FROM enrollments e 
        JOIN courses c ON e.course_id = c.id 
        WHERE e.student_id = $1 
        ORDER BY e.enrolled_at DESC 
        LIMIT 5
    `;
    const recentResult = await pool.query(recentQuery, [student_id]);

    res.status(200).json({
      status: "success",
      data: {
        stats: statsResult.rows[0],
        recent_courses: recentResult.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getInstructorDashboard = async (req, res, next) => {
  try {
    const instructor_id = req.user.id;

    // Stats: Total Students (unique), Total Courses, Total Reviews, Avg Rating
    const statsQuery = `
            SELECT 
                (SELECT COUNT(*) FROM courses WHERE instructor_id = $1) as total_courses,
                (SELECT COUNT(DISTINCT e.student_id) 
                 FROM enrollments e 
                 JOIN courses c ON e.course_id = c.id 
                 WHERE c.instructor_id = $1) as total_students,
                (SELECT AVG(average_rating) FROM courses WHERE instructor_id = $1) as instructor_rating
        `; // Simplified queries

    const statsResult = await pool.query(statsQuery, [instructor_id]);

    // My Courses Stats
    const coursesStats = await pool.query(
      `
            SELECT id, title, total_enrollments, average_rating 
            FROM courses 
            WHERE instructor_id = $1 
            ORDER BY total_enrollments DESC 
            LIMIT 5
        `,
      [instructor_id]
    );

    res.status(200).json({
      status: "success",
      data: {
        stats: statsResult.rows[0],
        top_courses: coursesStats.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminDashboard = async (req, res, next) => {
  try {
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*)::INTEGER FROM users WHERE role = 'student') as total_students,
        (SELECT COUNT(*)::INTEGER FROM users WHERE role = 'instructor') as total_instructors,
        (SELECT COUNT(*)::INTEGER FROM courses) as total_courses
    `;
    const statsResult = await pool.query(statsQuery);

    res.status(200).json({
      status: "success",
      data: {
        stats: statsResult.rows[0],
      },
    });
  } catch (error) {
    next(error);
  }
};
