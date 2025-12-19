import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  BookOpen,
  Home,
  LogOut,
  User,
  PlusCircle,
  LayoutDashboard,
  GraduationCap,
  Settings,
} from "lucide-react";

const Navbar = () => {
  const { user, logout, isStudent, isInstructor, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <GraduationCap className="h-8 w-8 text-primary-600" />
            <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
              EduLearn
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/"
              className="flex items-center space-x-1 text-gray-700 hover:text-primary-600 transition"
            >
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Link>

            <Link
              to="/courses"
              className="flex items-center space-x-1 text-gray-700 hover:text-primary-600 transition"
            >
              <BookOpen className="h-4 w-4" />
              <span>Courses</span>
            </Link>

            {user && (
              <>
                {isStudent && (
                  <>
                    <Link
                      to="/student/dashboard"
                      className="flex items-center space-x-1 text-gray-700 hover:text-primary-600 transition"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                    <Link
                      to="/student/my-courses"
                      className="text-gray-700 hover:text-primary-600 transition"
                    >
                      My Learning
                    </Link>
                    <Link
                      to="/student/grades"
                      className="text-gray-700 hover:text-primary-600 transition"
                    >
                      My Grades
                    </Link>
                  </>
                )}

                {isInstructor && (
                  <>
                    <Link
                      to="/instructor/dashboard"
                      className="flex items-center space-x-1 text-gray-700 hover:text-primary-600 transition"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                    <Link
                      to="/instructor/courses"
                      className="text-gray-700 hover:text-primary-600 transition"
                    >
                      My Courses
                    </Link>
                    <Link
                      to="/instructor/courses/create"
                      className="flex items-center space-x-1 btn-primary text-sm"
                    >
                      <PlusCircle className="h-4 w-4" />
                      <span>Create Course</span>
                    </Link>
                  </>
                )}

                {isAdmin && (
                  <>
                    <Link
                      to="/admin/dashboard"
                      className="flex items-center space-x-1 text-gray-700 hover:text-primary-600 transition"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      <span>Admin</span>
                    </Link>
                    <Link
                      to="/admin/categories"
                      className="text-gray-700 hover:text-primary-600 transition"
                    >
                      Categories
                    </Link>
                  </>
                )}
              </>
            )}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <Link
                  to="/profile"
                  className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition"
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary-600" />
                    </div>
                  )}
                  <span className="hidden md:block font-medium">
                    {user.name}
                  </span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-gray-700 hover:text-red-600 transition"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden md:block">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-primary-600 transition font-medium"
                >
                  Login
                </Link>
                <Link to="/register" className="btn-primary text-sm">
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
