import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/common/ProtectedRoute";
import Navbar from "./components/common/Navbar";

// Auth Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Profile from "./pages/auth/Profile";

// Public Pages
import HomePage from "./pages/HomePage";
import CourseBrowse from "./pages/student/CourseBrowse";
import CourseDetail from "./pages/student/CourseDetail";

// Student Pages
import StudentDashboard from "./pages/student/StudentDashboard";
import MyLearning from "./pages/student/MyLearning";
import CoursePlayer from "./pages/student/CoursePlayer";
import StudentGrades from "./pages/student/StudentGrades";

// Instructor Pages
import InstructorDashboard from "./pages/instructor/InstructorDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import CourseManagement from "./pages/instructor/CourseManagement";
import CourseCreate from "./pages/instructor/CourseCreate";
import CourseCurriculum from "./pages/instructor/CourseCurriculum";
import QuizBuilder from "./pages/instructor/QuizBuilder";
import AssignmentGrading from "./pages/instructor/AssignmentGrading";

// Admin Pages
import CategoryManagement from "./pages/admin/CategoryManagement";

// Test & Additional Components
import TestComponents from "./pages/TestComponents";
import QuizPlayer from "./components/quiz/QuizPlayer";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/courses" element={<CourseBrowse />} />
              <Route path="/courses/:id" element={<CourseDetail />} />
              <Route path="/test" element={<TestComponents />} />

              {/* Protected Routes */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/grades"
                element={
                  <ProtectedRoute allowedRoles={["student"]}>
                    <StudentGrades />
                  </ProtectedRoute>
                }
              />

              {/* Student Routes */}
              <Route
                path="/student/dashboard"
                element={
                  <ProtectedRoute allowedRoles={["student"]}>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/my-courses"
                element={
                  <ProtectedRoute allowedRoles={["student"]}>
                    <MyLearning />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/courses/:id/learn"
                element={
                  <ProtectedRoute allowedRoles={["student"]}>
                    <CoursePlayer />
                  </ProtectedRoute>
                }
              />

              {/* Instructor Routes */}
              <Route
                path="/instructor/dashboard"
                element={
                  <ProtectedRoute allowedRoles={["instructor", "admin"]}>
                    <InstructorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/instructor/courses"
                element={
                  <ProtectedRoute allowedRoles={["instructor", "admin"]}>
                    <CourseManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/instructor/courses/create"
                element={
                  <ProtectedRoute allowedRoles={["instructor", "admin"]}>
                    <CourseCreate />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/instructor/courses/edit/:id"
                element={
                  <ProtectedRoute allowedRoles={["instructor", "admin"]}>
                    <CourseCreate />
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/instructor/courses/:id/curriculum"
                element={
                  <ProtectedRoute allowedRoles={["instructor", "admin"]}>
                    <CourseCurriculum />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/instructor/quizzes/create/:lessonId"
                element={
                  <ProtectedRoute allowedRoles={["instructor", "admin"]}>
                    <QuizBuilder />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/instructor/assignments/:id/grade"
                element={
                  <ProtectedRoute allowedRoles={["instructor", "admin"]}>
                    <AssignmentGrading />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/categories"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <CategoryManagement />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
        <Toaster position="top-right" />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
