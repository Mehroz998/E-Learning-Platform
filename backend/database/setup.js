import pool from "./db.js";

const setupDb = async () => {
  try {
    console.log("Setting up database...");

    //Create User Table
    await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'instructor', 'admin')),
                avatar VARCHAR(255),
                bio TEXT,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            )
        `);

    //Create Category Table
    await pool.query(`
            CREATE TABLE IF NOT EXISTS categories (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                description TEXT,
                icon VARCHAR(50),
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            )
        `);

    //Create Course Table
    await pool.query(`
            CREATE TABLE IF NOT EXISTS courses (
                id SERIAL PRIMARY KEY,
                instructor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                slug VARCHAR(255) UNIQUE NOT NULL,
                description TEXT,
                category_id INTEGER REFERENCES categories(id),
                level VARCHAR(20) CHECK (level IN ('beginner', 'intermediate', 'advanced')),
                price DECIMAL(10,2) DEFAULT 0,
                thumbnail VARCHAR(255),
                status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
                total_duration INTEGER, -- in minutes
                total_lessons INTEGER DEFAULT 0,
                total_enrollments INTEGER DEFAULT 0,
                average_rating DECIMAL(3,2) DEFAULT 0,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            );    
        `);

    //Create Section Table
    await pool.query(`
            CREATE TABLE IF NOT EXISTS sections (
                id SERIAL PRIMARY KEY,
                course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                order_index INTEGER NOT NULL,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            );
        `);

    //Create Lesson Table
    await pool.query(`
            CREATE TABLE IF NOT EXISTS lessons (
                id SERIAL PRIMARY KEY,
                section_id INTEGER REFERENCES sections(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                content_type VARCHAR(20) CHECK (content_type IN ('video', 'text', 'quiz', 'assignment')),
                video_url VARCHAR(500),
                text_content TEXT,
                duration INTEGER, -- in minutes
                order_index INTEGER NOT NULL,
                is_preview BOOLEAN DEFAULT false,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            );
        `);

    //Create Enrollment Table
    await pool.query(`
            CREATE TABLE IF NOT EXISTS enrollments (
                id SERIAL PRIMARY KEY,
                student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
                enrolled_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                progress INTEGER DEFAULT 0, -- percentage
                completed_at TIMESTAMPTZ,
                certificate_url VARCHAR(255),
                UNIQUE(student_id, course_id)
            );    
        `);

    //Create Progress Table
    await pool.query(`
            CREATE TABLE IF NOT EXISTS lesson_progress (
                id SERIAL PRIMARY KEY,
                enrollment_id INTEGER REFERENCES enrollments(id) ON DELETE CASCADE,
                lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
                completed BOOLEAN DEFAULT false,
                completed_at TIMESTAMPTZ,
                UNIQUE(enrollment_id, lesson_id)
            );
        `);

    //Create Quiz Table
    await pool.query(`
            CREATE TABLE IF NOT EXISTS quizzes (
                id SERIAL PRIMARY KEY,
                lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                passing_score INTEGER DEFAULT 70,
                time_limit INTEGER, -- in minutes
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            );
        `);

    //Create Quiz Question Table
    await pool.query(`
            CREATE TABLE IF NOT EXISTS quiz_questions (
                id SERIAL PRIMARY KEY,
                quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
                question TEXT NOT NULL,
                option_a TEXT NOT NULL,
                option_b TEXT NOT NULL,
                option_c TEXT NOT NULL,
                option_d TEXT NOT NULL,
                correct_answer CHAR(1) CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
                points INTEGER DEFAULT 1,
                order_index INTEGER
            );
        `);

    //Create Quiz Attempt Table
    await pool.query(`
            CREATE TABLE IF NOT EXISTS quiz_attempts (
                id SERIAL PRIMARY KEY,
                enrollment_id INTEGER REFERENCES enrollments(id) ON DELETE CASCADE,
                quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
                score INTEGER,
                total_points INTEGER,
                percentage DECIMAL(5,2),
                passed BOOLEAN,
                started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMPTZ
            );
        `);

    //Create Assignment Table
    await pool.query(`
            CREATE TABLE IF NOT EXISTS assignments (
                id SERIAL PRIMARY KEY,
                lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                due_date TIMESTAMPTZ,
                max_score INTEGER DEFAULT 100,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            );
        `);

    //Create Assignment Submission Table
    await pool.query(`
            CREATE TABLE IF NOT EXISTS assignment_submissions (
                id SERIAL PRIMARY KEY,
                assignment_id INTEGER REFERENCES assignments(id) ON DELETE CASCADE,
                student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                content TEXT,
                file_url VARCHAR(255),
                submitted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                grade INTEGER,
                feedback TEXT,
                graded_by INTEGER REFERENCES users(id),
                graded_at TIMESTAMPTZ,
                UNIQUE(assignment_id, student_id)
            );
        `);

    //Create Reviews Table
    await pool.query(`
            CREATE TABLE IF NOT EXISTS reviews (
                id SERIAL PRIMARY KEY,
                course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
                student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                rating INTEGER CHECK (rating >= 1 AND rating <= 5),
                review TEXT,
                helpful_count INTEGER DEFAULT 0,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(course_id, student_id)
            );
    `);

    //Create Resources Table
    await pool.query(`
            CREATE TABLE IF NOT EXISTS resources (
                id SERIAL PRIMARY KEY,
                lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                file_url VARCHAR(500) NOT NULL,
                file_size INTEGER,
                file_type VARCHAR(50),
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            );
    `);

    //refresh Token
    await pool.query(`
            CREATE TABLE IF NOT EXISTS refresh_tokens (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                token text NOT NULL,
                expires_at TIMESTAMPTZ NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                revoked BOOLEAN DEFAULT false
            );
    `);

    console.log("Database Setup Completed");
    process.exit(0);
  } catch (error) {
    console.error("Error setting up database:", error);
    process.exit(1);
  }
};

setupDb();
