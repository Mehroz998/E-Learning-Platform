import pool from "../database/db.js";
import AppError from "../utils/AppError.js";
import { uploadThumbnail } from "../utils/cloudinary.js";

// Helper to create slug
const createSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
};

// Create a new course
export const createCourse = async (req, res, next) => {
  try {
    const { title, description, category_id, level, price, status } = req.body;
    let thumbnail = req.body.thumbnail;
    const instructor_id = req.user.id;

    if (req.file) {
      thumbnail = await uploadThumbnail(req.file.path);
    } else if (thumbnail && !thumbnail.includes("cloudinary.com")) {
      try {
        thumbnail = await uploadThumbnail(thumbnail);
      } catch (error) {
        throw new AppError("Failed to upload thumbnail from URL", 400);
      }
    }

    if (!title || !description || !category_id || !level || !price) {
      throw new AppError("All fields are required", 400);
    }

    // Generate slug
    let slug = createSlug(title);

    // Ensure slug is unique
    const slugCheck = await pool.query(
      "SELECT id FROM courses WHERE slug = $1",
      [slug]
    );
    if (slugCheck.rows.length > 0) {
      slug = `${slug}-${Date.now()}`;
    }

    const query = `
      INSERT INTO courses (
        instructor_id, title, slug, description, category_id, level, price, thumbnail, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;
    const values = [
      instructor_id,
      title,
      slug,
      description,
      category_id,
      level,
      price,
      thumbnail,
      status || "draft",
    ];

    const result = await pool.query(query, values);
    res.status(201).json({
      status: "success",
      data: {
        course: result.rows[0],
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to create course",
      error: error,
    });
  }
};

// Get all courses with filtering, sorting, and pagination
export const getAllCourses = async (req, res, next) => {
  try {
    const {
      category,
      level,
      price_min,
      price_max,
      search,
      sort,
      page = 1,
      limit = 10,
    } = req.query;

    let query = `
      SELECT c.id, c.instructor_id, c.title, c.slug, c.description, c.category_id, 
             c.level, c.price, c.thumbnail, c.status, c.total_enrollments, c.average_rating,
             c.created_at, c.updated_at,
             (SELECT COUNT(*) FROM lessons l JOIN sections s ON l.section_id = s.id WHERE s.course_id = c.id)::INTEGER as total_lessons,
             (SELECT COALESCE(SUM(l.duration), 0) FROM lessons l JOIN sections s ON l.section_id = s.id WHERE s.course_id = c.id)::INTEGER as total_duration,
             u.name as instructor_name, cat.name as category_name 
      FROM courses c 
      JOIN users u ON c.instructor_id = u.id 
      LEFT JOIN categories cat ON c.category_id = cat.id
      WHERE 1=1
    `;
    const values = [];
    let paramIndex = 1;

    // Filters
    if (category) {
      query += ` AND cat.name = $${paramIndex}`;
      values.push(category);
      paramIndex++;
    }
    if (level) {
      query += ` AND c.level = $${paramIndex}`;
      values.push(level);
      paramIndex++;
    }
    if (price_min) {
      query += ` AND c.price >= $${paramIndex}`;
      values.push(price_min);
      paramIndex++;
    }
    if (price_max) {
      query += ` AND c.price <= $${paramIndex}`;
      values.push(price_max);
      paramIndex++;
    }
    if (search) {
      query += ` AND (c.title ILIKE $${paramIndex} OR c.description ILIKE $${paramIndex})`;
      values.push(`%${search}%`);
      paramIndex++;
    }

    // Sorting
    if (sort === "newest") {
      query += ` ORDER BY c.created_at DESC`;
    } else if (sort === "popularity") {
      query += ` ORDER BY c.total_enrollments DESC`;
    } else if (sort === "rating") {
      query += ` ORDER BY c.average_rating DESC`;
    } else if (sort === "price_asc") {
      query += ` ORDER BY c.price ASC`;
    } else if (sort === "price_desc") {
      query += ` ORDER BY c.price DESC`;
    } else {
      query += ` ORDER BY c.created_at DESC`; // Default
    }

    // Pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);

    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) FROM courses c WHERE 1=1`; // Simplified count for now
    const countResult = await pool.query(countQuery); // Can add filters to count as well ideally

    res.status(200).json({
      status: "success",
      results: result.rows.length,
      data: {
        courses: result.rows,
        total: parseInt(countResult.rows[0].count),
      },
    });
  } catch (error) {
    res.json({
      status: "error",
      message: "Failed to fetch courses",
      error: error,
    });
  }
};

// Get single course details
export const getCourseById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let student_id = null;

    // Optional authentication check
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1];
        const { verifyAccessToken } = await import("../utils/jwt.js");
        const decoded = verifyAccessToken(token);
        student_id = decoded.id;
      } catch (err) {
        // Ignore invalid tokens for public route
      }
    }

    const query = `
      SELECT c.id, c.instructor_id, c.title, c.slug, c.description, c.category_id, 
             c.level, c.price, c.thumbnail, c.status, c.total_enrollments, c.average_rating,
             c.created_at, c.updated_at,
             (SELECT COUNT(*) FROM lessons l JOIN sections s ON l.section_id = s.id WHERE s.course_id = c.id)::INTEGER as total_lessons,
             (SELECT COALESCE(SUM(l.duration), 0) FROM lessons l JOIN sections s ON l.section_id = s.id WHERE s.course_id = c.id)::INTEGER as total_duration,
             u.name as instructor_name, cat.name as category_name 
      FROM courses c 
      JOIN users u ON c.instructor_id = u.id 
      LEFT JOIN categories cat ON c.category_id = cat.id
      WHERE c.id = $1
    `;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return next(new AppError("Course not found", 404));
    }

    const course = result.rows[0];

    // Check enrollment if user is logged in
    let is_enrolled = false;
    if (student_id) {
      const enrollmentCheck = await pool.query(
        "SELECT id FROM enrollments WHERE student_id = $1 AND course_id = $2",
        [student_id, id]
      );
      is_enrolled = enrollmentCheck.rows.length > 0;
    }

    res.status(200).json({
      status: "success",
      data: {
        course: { ...course, is_enrolled },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update course
export const updateCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, category_id, level, price, status } = req.body;
    let thumbnail = req.body.thumbnail;

    if (req.file) {
      thumbnail = await uploadThumbnail(req.file.path);
    } else if (thumbnail && !thumbnail.includes("cloudinary.com")) {
      try {
        thumbnail = await uploadThumbnail(thumbnail);
      } catch (error) {
        throw new AppError("Failed to upload thumbnail from URL", 400);
      }
    }

    // Check if course exists and belongs to instructor
    const checkQuery = `SELECT * FROM courses WHERE id = $1`;
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return next(new AppError("Course not found", 404));
    }

    if (
      checkResult.rows[0].instructor_id !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return next(
        new AppError("You are not authorized to update this course", 403)
      );
    }

    // Dynamic update
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
    if (category_id) {
      updates.push(`category_id = $${paramIndex}`);
      values.push(category_id);
      paramIndex++;
    }
    if (level) {
      updates.push(`level = $${paramIndex}`);
      values.push(level);
      paramIndex++;
    }
    if (price !== undefined) {
      updates.push(`price = $${paramIndex}`);
      values.push(price);
      paramIndex++;
    }
    if (thumbnail) {
      updates.push(`thumbnail = $${paramIndex}`);
      values.push(thumbnail);
      paramIndex++;
    }
    if (status) {
      updates.push(`status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }

    updates.push(`updated_at = NOW()`);

    if (updates.length === 1) {
      // Only updated_at
      return next(new AppError("No data to update", 400));
    }

    values.push(id);
    const query = `
      UPDATE courses 
      SET ${updates.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    res.status(200).json({
      status: "success",
      data: {
        course: result.rows[0],
      },
    });
  } catch (error) {
    res.json({
      status: "error",
      message: "Failed to update course",
      error: error,
    });
  }
};

// Delete course
export const deleteCourse = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check ownership
    const checkQuery = `SELECT instructor_id FROM courses WHERE id = $1`;
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return next(new AppError("Course not found", 404));
    }

    if (
      checkResult.rows[0].instructor_id !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return next(
        new AppError("You are not authorized to delete this course", 403)
      );
    }

    const result = await pool.query(
      `DELETE FROM courses WHERE id = $1 RETURNING *`,
      [id]
    );

    res.status(204).json({
      status: "success",
      data: result.rows[0],
    });
  } catch (error) {
    res.json({
      status: "error",
      message: "Failed to delete course",
      error: error,
    });
  }
};

// Enroll in course
export const enrollCourse = async (req, res, next) => {
  try {
    const { id } = req.params; // course id
    const student_id = req.user.id;

    // Check if course exists
    const courseCheck = await pool.query(
      "SELECT id, price FROM courses WHERE id = $1",
      [id]
    );
    if (courseCheck.rows.length === 0) {
      return next(new AppError("Course not found", 404));
    }

    // Check if already enrolled
    const enrollmentCheck = await pool.query(
      "SELECT id FROM enrollments WHERE student_id = $1 AND course_id = $2",
      [student_id, id]
    );

    if (enrollmentCheck.rows.length > 0) {
      return next(new AppError("You are already enrolled in this course", 400));
    }

    // Insert enrollment
    const query = `
        INSERT INTO enrollments (student_id, course_id)
        VALUES ($1, $2)
        RETURNING *
    `;
    const result = await pool.query(query, [student_id, id]);

    // Update total_enrollments in courses
    await pool.query(
      "UPDATE courses SET total_enrollments = total_enrollments + 1 WHERE id = $1",
      [id]
    );

    res.status(201).json({
      status: "success",
      data: {
        enrollment: result.rows[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get Course Curriculum
export const getCourseCurriculum = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check course existence
    const courseCheck = await pool.query(
      "SELECT id FROM courses WHERE id = $1",
      [id]
    );
    if (courseCheck.rows.length === 0) {
      return next(new AppError("Course not found", 404));
    }

    // Get sections
    const sectionsQuery = `
            SELECT * FROM sections 
            WHERE course_id = $1 
            ORDER BY order_index ASC
        `;
    const sectionsResult = await pool.query(sectionsQuery, [id]);
    const sections = sectionsResult.rows;

    // Get lessons for all sections
    const sectionIds = sections.map((s) => s.id);
    let lessons = [];
    if (sectionIds.length > 0) {
      let lessonsQuery = "";
      let queryValues = [];

      if (req.user && req.user.role === "student") {
        lessonsQuery = `
          SELECT l.*, COALESCE(lp.completed, false) as is_completed, a.id as assignment_id 
          FROM lessons l
          LEFT JOIN assignments a ON l.id = a.lesson_id
          LEFT JOIN (
            SELECT lp.* 
            FROM lesson_progress lp
            JOIN enrollments e ON lp.enrollment_id = e.id
            WHERE e.student_id = $1 AND e.course_id = $2
          ) lp ON l.id = lp.lesson_id
          WHERE l.section_id = ANY($3)
          ORDER BY l.order_index ASC
        `;
        queryValues = [req.user.id, id, sectionIds];
      } else {
        lessonsQuery = `
          SELECT l.*, false as is_completed, a.id as assignment_id 
          FROM lessons l
          LEFT JOIN assignments a ON l.id = a.lesson_id
          WHERE l.section_id = ANY($1) 
          ORDER BY l.order_index ASC
        `;
        queryValues = [sectionIds];
      }

      const lessonsResult = await pool.query(lessonsQuery, queryValues);
      lessons = lessonsResult.rows;
    }

    // Get enrollment for student
    let enrollment = null;
    if (req.user && req.user.role === "student") {
      const enrollmentRes = await pool.query(
        "SELECT * FROM enrollments WHERE student_id = $1 AND course_id = $2",
        [req.user.id, id]
      );
      if (enrollmentRes.rows.length > 0) {
        enrollment = enrollmentRes.rows[0];
      }
    }

    // Structure the response
    const curriculum = sections.map((section) => {
      return {
        ...section,
        lessons: lessons.filter((lesson) => lesson.section_id === section.id),
      };
    });

    res.status(200).json({
      status: "success",
      data: {
        curriculum,
        enrollment,
      },
    });
  } catch (error) {
    res.json({
      status: "error",
      message: "Failed to fetch course curriculum",
      error: error,
    });
  }
};

// Get Student Enrolled Courses
export const getStudentCourses = async (req, res, next) => {
  try {
    const student_id = req.user.id;

    const query = `
            SELECT c.id, c.instructor_id, c.title, c.slug, c.description, c.category_id, 
                   c.level, c.price, c.thumbnail, c.status, c.total_enrollments, c.average_rating,
                   c.created_at, c.updated_at,
                   (SELECT COUNT(*) FROM lessons l JOIN sections s ON l.section_id = s.id WHERE s.course_id = c.id)::INTEGER as total_lessons,
                   (SELECT COALESCE(SUM(l.duration), 0) FROM lessons l JOIN sections s ON l.section_id = s.id WHERE s.course_id = c.id)::INTEGER as total_duration,
                   e.id as enrollment_id, e.progress, e.enrolled_at, e.completed_at 
            FROM enrollments e
            JOIN courses c ON e.course_id = c.id
            WHERE e.student_id = $1
            ORDER BY e.enrolled_at DESC
        `;
    const result = await pool.query(query, [student_id]);

    res.status(200).json({
      status: "success",
      results: result.rows.length,
      data: {
        courses: result.rows,
      },
    });
  } catch (error) {
    res.json({
      status: "error",
      message: "Failed to fetch student courses",
      error: error,
    });
  }
};

// Get Instructor Teaching Courses
export const getMyTeachingCourses = async (req, res, next) => {
  try {
    const instructor_id = req.user.id;

    const query = `
            SELECT c.id, c.instructor_id, c.title, c.slug, c.description, c.category_id, 
                   c.level, c.price, c.thumbnail, c.status, c.total_enrollments, c.average_rating,
                   c.created_at, c.updated_at,
                   (SELECT COUNT(*) FROM lessons l JOIN sections s ON l.section_id = s.id WHERE s.course_id = c.id)::INTEGER as total_lessons,
                   (SELECT COALESCE(SUM(l.duration), 0) FROM lessons l JOIN sections s ON l.section_id = s.id WHERE s.course_id = c.id)::INTEGER as total_duration
            FROM courses c 
            WHERE c.instructor_id = $1
            ORDER BY c.created_at DESC
        `;

    const result = await pool.query(query, [instructor_id]);

    res.status(200).json({
      status: "success",
      results: result.rows.length,
      data: {
        courses: result.rows,
      },
    });
  } catch (error) {
    res.json({
      status: "error",
      message: "Failed to fetch instructor courses",
      error: error,
    });
  }
};
