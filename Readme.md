# EduLearn

A comprehensive Learning Management System (LMS) designed to facilitate seamless online education. EduLearn bridges the gap between instructors and students, offering robust tools for course creation, enrollment, progress tracking, and assessment.

## Features

- **Role-Based Access Control**: specialized dashboards for Students, Instructors, and Admins.
- **Course Management**: Instructors can create, edit, and publish comprehensive courses with organized sections and lessons.
- **Interactive Learning**: Support for video lessons, rich text content, and downloadable resources.
- **Assessments**:
  - **Quizzes**: Timed quizzes with immediate feedback.
  - **Assignments**: File and text submissions with instructor grading and feedback.
- **Progress Tracking**: Real-time progress monitoring and course completion status.
- **Certification**: Automated certificate generation upon successful course completion.
- **Student Engagement**:
  - **Reviews**: Course rating and review system.
  - **Enrollment History**: specialized "My Learning" view.
- **Admin Controls**: Platform-wide statistics and category management.
- **Secure Authentication**: JWT-based authentication with secure password hashing.

## Tech Stack

**Backend:**

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL (pg)
- **Authentication**: JWT, bcrypt
- **File Uploads**: Cloudinary, Multer
- **Security**: Helmet, Express Rate Limit
- **Utilities**: Dotenv, Cors

**Frontend:**

- **Framework**: React (Vite)
- **Styling**: Tailwind CSS
- **Routing**: React Router Dom
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Date Handling**: Date-fns

## Installation

### Backend

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Create a `.env` file in the `backend` directory and add your configuration (DB credentials, JWT secret, Cloudinary keys, etc.).

4. Setup the Database:

   ```bash
   npm run db:setup
   ```

   "My Db host in neon"

5. Start the Server:
   ```bash
   npm run dev
   ```

### Frontend

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the Development Server:
   ```bash
   npm run dev
   ```

## License

MIT
