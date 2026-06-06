import pool from "../database/db.js";
import AppError from "../utils/AppError.js";

export const createAssignment = async (req, res, next) => {
  try {
    const { id: lesson_id } = req.params;
    const { title, description, due_date, max_score } = req.body;

    const check = await pool.query(
      `
        SELECT l.id, c.instructor_id 
        FROM lessons l
        JOIN sections s ON l.section_id = s.id
        JOIN courses c ON s.course_id = c.id
        WHERE l.id = $1
    `,
      [lesson_id]
    );

    if (check.rows.length === 0)
      return next(new AppError("Lesson not found", 404));
    if (
      check.rows[0].instructor_id !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return next(new AppError("Not authorized", 403));
    }

    const query = `
        INSERT INTO assignments (lesson_id, title, description, due_date, max_score)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
    `;
    const result = await pool.query(query, [
      lesson_id,
      title,
      description,
      due_date,
      max_score || 100,
    ]);

    res
      .status(201)
      .json({ status: "success", data: { assignment: result.rows[0] } });
  } catch (error) {
    next(error);
  }
};

export const getAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM assignments WHERE id = $1", [
      id,
    ]);

    if (result.rows.length === 0)
      return next(new AppError("Assignment not found", 404));

    res
      .status(200)
      .json({ status: "success", data: { assignment: result.rows[0] } });
  } catch (error) {
    next(error);
  }
};

export const getAssignmentByLesson = async (req, res, next) => {
  try {
    const { id: lessonId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const result = await pool.query(
      "SELECT * FROM assignments WHERE lesson_id = $1",
      [lessonId]
    );

    if (result.rows.length === 0) {
      return res
        .status(200)
        .json({ status: "success", data: { assignment: null } });
    }

    const assignment = result.rows[0];
    let submission = null;

    // If student, get their submission
    if (userRole === "student") {
      const subResult = await pool.query(
        "SELECT * FROM assignment_submissions WHERE assignment_id = $1 AND student_id = $2",
        [assignment.id, userId]
      );
      submission = subResult.rows[0] || null;
    }

    res.status(200).json({
      status: "success",
      data: { assignment, submission },
    });
  } catch (error) {
    next(error);
  }
};

export const getAssignmentSubmissions = async (req, res, next) => {
  try {
    const { id } = req.params; // assignment_id
    const instructorId = req.user.id;

    // Verify ownership
    const check = await pool.query(
      `
        SELECT a.id 
        FROM assignments a
        JOIN lessons l ON a.lesson_id = l.id
        JOIN sections s ON l.section_id = s.id
        JOIN courses c ON s.course_id = c.id
        WHERE a.id = $1 AND (c.instructor_id = $2 OR $3 = 'admin')
      `,
      [id, instructorId, req.user.role]
    );

    if (check.rows.length === 0) {
      return next(new AppError("Assignment not found or unauthorized", 403));
    }

    const submissions = await pool.query(
      `
        SELECT asub.*, u.name as student_name, u.email as student_email
        FROM assignment_submissions asub
        JOIN users u ON asub.student_id = u.id
        WHERE asub.assignment_id = $1
        ORDER BY asub.submitted_at DESC
      `,
      [id]
    );

    res.status(200).json({
      status: "success",
      data: { submissions: submissions.rows },
    });
  } catch (error) {
    next(error);
  }
};

export const submitAssignment = async (req, res, next) => {
  try {
    const { id } = req.params; // assignment id
    const { content, file_url } = req.body;
    const student_id = req.user.id;

    // Check enrollment? or just insert. Constraint expects assignment_id, student_id.

    const query = `
        INSERT INTO assignment_submissions (assignment_id, student_id, content, file_url)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (assignment_id, student_id) 
        DO UPDATE SET content = $3, file_url = $4, submitted_at = NOW()
        RETURNING *
    `;
    const result = await pool.query(query, [id, student_id, content, file_url]);

    res
      .status(201)
      .json({ status: "success", data: { submission: result.rows[0] } });
  } catch (error) {
    next(error);
  }
};

export const gradeSubmission = async (req, res, next) => {
  try {
    const { id } = req.params; // submission id
    const { grade, feedback } = req.body;
    const grader_id = req.user.id;

    // Verify grader is instructor of course and get additional data
    const authCheck = await pool.query(
      `
            SELECT asub.id, asub.student_id, a.lesson_id,
                   e.id as enrollment_id,
                   (SELECT COUNT(*) FROM lessons l2 
                    JOIN sections s2 ON l2.section_id = s2.id 
                    WHERE s2.course_id = c.id) as total_lessons
            FROM assignment_submissions asub
            JOIN assignments a ON asub.assignment_id = a.id
            JOIN lessons l ON a.lesson_id = l.id
            JOIN sections s ON l.section_id = s.id
            JOIN courses c ON s.course_id = c.id
            JOIN enrollments e ON c.id = e.course_id AND e.student_id = asub.student_id
            WHERE asub.id = $1 AND (c.instructor_id = $2 OR $3 = 'admin')
        `,
      [id, grader_id, req.user.role]
    );

    if (authCheck.rows.length === 0)
      return next(new AppError("Submission not found or unauthorized", 403));

    const { lesson_id, enrollment_id, total_lessons } = authCheck.rows[0];

    const query = `
            UPDATE assignment_submissions
            SET grade = $1, feedback = $2, graded_by = $3, graded_at = NOW()
            WHERE id = $4
            RETURNING *
        `;
    const result = await pool.query(query, [grade, feedback, grader_id, id]);

    // Mark lesson as complete after grading
    await pool.query(
      `
            INSERT INTO lesson_progress (enrollment_id, lesson_id, completed, completed_at)
            VALUES ($1, $2, true, NOW())
            ON CONFLICT (enrollment_id, lesson_id) DO UPDATE 
            SET completed = true, completed_at = NOW()
        `,
      [enrollment_id, lesson_id]
    );

    // Update enrollment progress
    const countCompleted = await pool.query(
      "SELECT COUNT(*) FROM lesson_progress WHERE enrollment_id = $1 AND completed = true",
      [enrollment_id]
    );
    const completedCount = parseInt(countCompleted.rows[0].count);
    const progressPercent =
      total_lessons > 0
        ? Math.round((completedCount / total_lessons) * 100)
        : 0;

    const completed_at = progressPercent === 100 ? new Date() : null;
    await pool.query(
      "UPDATE enrollments SET progress = $1, completed_at = $2 WHERE id = $3",
      [progressPercent, completed_at, enrollment_id]
    );

    res
      .status(200)
      .json({ status: "success", data: { submission: result.rows[0] } });
  } catch (error) {
    next(error);
  }
};
