import pool from "../database/db.js";
import AppError from "../utils/AppError.js";

// Create Quiz (Instructor)
export const createQuiz = async (req, res, next) => {
  try {
    const { id: lesson_id } = req.params;
    const { title, passing_score, time_limit, questions } = req.body; // questions is array of objects

    const check = await pool.query(
      `
        SELECT l.id, c.instructor_id, q.id as quiz_id
        FROM lessons l
        JOIN sections s ON l.section_id = s.id
        JOIN courses c ON s.course_id = c.id
        LEFT JOIN quizzes q ON l.id = q.lesson_id
        WHERE l.id = $1
    `,
      [lesson_id]
    );

    if (check.rows.length === 0)
      return next(new AppError("Lesson not found", 404));

    const isOwner =
      check.rows[0].instructor_id === req.user.id || req.user.role === "admin";
    if (!isOwner) {
      return next(new AppError("Not authorized", 403));
    }

    const existingQuizId = check.rows[0].quiz_id;

    // Transaction start
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      let quizId = existingQuizId;

      if (existingQuizId) {
        // Update existing quiz settings
        await client.query(
          "UPDATE quizzes SET title = $1, passing_score = $2, time_limit = $3 WHERE id = $4",
          [title, passing_score, time_limit, existingQuizId]
        );
        // Delete old questions to replace them
        await client.query("DELETE FROM quiz_questions WHERE quiz_id = $1", [
          existingQuizId,
        ]);
      } else {
        // Insert new Quiz
        const quizQuery = `
              INSERT INTO quizzes (lesson_id, title, passing_score, time_limit)
              VALUES ($1, $2, $3, $4)
              RETURNING id;
          `;
        const quizResult = await client.query(quizQuery, [
          lesson_id,
          title,
          passing_score,
          time_limit,
        ]);
        quizId = quizResult.rows[0].id;
      }

      // Insert Questions
      if (questions && questions.length > 0) {
        for (const q of questions) {
          const questionQuery = `
                    INSERT INTO quiz_questions (quiz_id, question, option_a, option_b, option_c, option_d, correct_answer, points, order_index)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                `;
          await client.query(questionQuery, [
            quizId,
            q.question,
            q.option_a,
            q.option_b,
            q.option_c,
            q.option_d,
            q.correct_answer,
            q.points || 1,
            q.order_index,
          ]);
        }
      }

      await client.query("COMMIT");
      res.status(existingQuizId ? 200 : 201).json({
        status: "success",
        message: existingQuizId ? "Quiz updated" : "Quiz created",
        data: { quiz_id: quizId },
      });
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
};

// Get Quiz (Student/Instructor) - Should probably hide correct answers if student is attempting?
// Usually, we fetch questions without correct answers for attempt.
export const getQuiz = async (req, res, next) => {
  try {
    const { id } = req.params;

    const quizResult = await pool.query("SELECT * FROM quizzes WHERE id = $1", [
      id,
    ]);
    if (quizResult.rows.length === 0)
      return next(new AppError("Quiz not found", 404));

    // For simplicity, we return everything. Frontend should hide answers visually, or we could filter.
    // Let's filter correct_answer if we want to be secure, but 'getQuiz' might be for editing too.
    // Let's assume this is for 'viewing details' or 'editing'. Attempt has separate logic often.

    // Fetch questions
    const qResult = await pool.query(
      "SELECT * FROM quiz_questions WHERE quiz_id = $1 ORDER BY order_index ASC",
      [id]
    );

    res.status(200).json({
      status: "success",
      data: {
        quiz: quizResult.rows[0],
        questions: qResult.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Attempt Quiz (Start) - Logic might just be logging start time, or returning questions without answers.
export const attemptQuiz = async (req, res, next) => {
  // For now, simple start logging or just return questions without answers
  try {
    const { id } = req.params;
    const student_id = req.user.id;

    // Find enrollment
    const quizInfo = await pool.query(
      `
            SELECT q.lesson_id, e.id as enrollment_id
            FROM quizzes q
            JOIN lessons l ON q.lesson_id = l.id
            JOIN sections s ON l.section_id = s.id
            JOIN courses c ON s.course_id = c.id
            JOIN enrollments e ON c.id = e.course_id
            WHERE q.id = $1 AND e.student_id = $2
        `,
      [id, student_id]
    );

    if (quizInfo.rows.length === 0)
      return next(new AppError("Not enrolled or quiz not found", 403));

    // Return questions without correct answer
    const qResult = await pool.query(
      "SELECT id, question, option_a, option_b, option_c, option_d FROM quiz_questions WHERE quiz_id = $1 ORDER BY order_index ASC",
      [id]
    );

    res.status(200).json({
      status: "success",
      data: {
        questions: qResult.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Submit Quiz
export const submitQuiz = async (req, res, next) => {
  try {
    const { id } = req.params; // quiz id
    const { answers } = req.body; // map of question_id -> answer char (A,B,C,D)
    const student_id = req.user.id;

    // Get Quiz Info & Questions with Answers
    const quizData = await pool.query(
      `
        SELECT q.*, e.id as enrollment_id
        FROM quizzes q
        JOIN lessons l ON q.lesson_id = l.id
        JOIN sections s ON l.section_id = s.id
        JOIN courses c ON s.course_id = c.id
        JOIN enrollments e ON c.id = e.course_id
        WHERE q.id = $1 AND e.student_id = $2
    `,
      [id, student_id]
    );

    if (quizData.rows.length === 0)
      return next(new AppError("Not enrolled or quiz not found", 403));

    const enrollment_id = quizData.rows[0].enrollment_id;
    const passing_score = quizData.rows[0].passing_score;

    const questionsRes = await pool.query(
      "SELECT id, correct_answer, points FROM quiz_questions WHERE quiz_id = $1",
      [id]
    );
    const questions = questionsRes.rows;

    let score = 0;
    let total_points = 0;

    questions.forEach((q) => {
      total_points += q.points;
      if (answers[q.id] === q.correct_answer) {
        score += q.points;
      }
    });

    const percentage = total_points > 0 ? (score / total_points) * 100 : 0;
    const passed = percentage >= passing_score;

    // Save Attempt
    const insertAttempt = `
        INSERT INTO quiz_attempts (enrollment_id, quiz_id, score, total_points, percentage, passed, completed_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING *
    `;
    const result = await pool.query(insertAttempt, [
      enrollment_id,
      id,
      score,
      total_points,
      percentage,
      passed,
    ]);

    res.status(200).json({
      status: "success",
      data: {
        score,
        total_points,
        percentage,
        passed,
        attempt: result.rows[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get Results
export const getQuizResults = async (req, res, next) => {
  try {
    const { id } = req.params; // quiz id
    const student_id = req.user.id;

    const results = await pool.query(
      `
            SELECT qa.* 
            FROM quiz_attempts qa
            JOIN enrollments e ON qa.enrollment_id = e.id
            WHERE qa.quiz_id = $1 AND e.student_id = $2
            ORDER BY qa.completed_at DESC
        `,
      [id, student_id]
    );

    res.status(200).json({
      status: "success",
      results: results.rows.length,
      data: { attempts: results.rows },
    });
  } catch (error) {
    next(error);
  }
};
// Get Quiz by Lesson ID (For editing or student view)
export const getQuizByLesson = async (req, res, next) => {
  try {
    const { id: lesson_id } = req.params;

    const quizResult = await pool.query(
      "SELECT * FROM quizzes WHERE lesson_id = $1",
      [lesson_id]
    );

    if (quizResult.rows.length === 0) {
      // It's fine to return no quiz if it doesn't exist yet
      return res.status(200).json({
        status: "success",
        data: { quiz: null, questions: [] },
      });
    }

    const quiz = quizResult.rows[0];

    // Fetch questions
    const qResult = await pool.query(
      "SELECT * FROM quiz_questions WHERE quiz_id = $1 ORDER BY order_index ASC",
      [quiz.id]
    );

    res.status(200).json({
      status: "success",
      data: {
        quiz,
        questions: qResult.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getStudentQuizHistory = async (req, res, next) => {
  try {
    const student_id = req.user.id;

    const query = `
      SELECT 
        qa.id, 
        qa.score, 
        qa.total_points, 
        qa.percentage, 
        qa.passed, 
        qa.completed_at,
        q.title as quiz_title,
        l.title as lesson_title,
        c.title as course_title
      FROM quiz_attempts qa
      JOIN quizzes q ON qa.quiz_id = q.id
      JOIN lessons l ON q.lesson_id = l.id
      JOIN sections s ON l.section_id = s.id
      JOIN courses c ON s.course_id = c.id
      WHERE qa.enrollment_id IN (SELECT id FROM enrollments WHERE student_id = $1)
      ORDER BY qa.completed_at DESC
    `;

    const result = await pool.query(query, [student_id]);

    res.status(200).json({
      status: "success",
      data: { history: result.rows },
    });
  } catch (error) {
    next(error);
  }
};
