import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { dashboardAPI } from "../../api/dashboard";
import { BookOpen, Clock, Award, TrendingUp } from "lucide-react";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ProgressBar from "../../components/course/ProgressBar";

const StudentDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await dashboardAPI.getStudentDashboard();
      setData(response.data);
    } catch (error) {
      console.error("Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" className="min-h-screen" />;

  const stats = data?.stats || {};
  const recentCourses = data?.recent_courses || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Enrolled</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.total_enrolled || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-primary-600" />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Active Courses</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.active_courses || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Completed</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.completed_courses || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Award className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Courses */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Continue Learning
            </h2>
            <Link
              to="/student/my-courses"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              View All
            </Link>
          </div>

          {recentCourses.length > 0 ? (
            <div className="space-y-4">
              {recentCourses.map((course, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <div className="flex-shrink-0">
                    {course.thumbnail ? (
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-gradient-to-r from-primary-400 to-secondary-400 flex items-center justify-center">
                        <BookOpen className="h-8 w-8 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {course.title}
                    </h3>
                    <ProgressBar
                      percentage={course.progress || 0}
                      className="mt-2"
                    />
                  </div>
                  <Link
                    to={`/courses/${course.id}/learn`}
                    className="btn-primary text-sm whitespace-nowrap"
                  >
                    Continue
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="h-16 w-16 mx-auto mb-3 text-gray-400" />
              <p>No courses yet. Start learning today!</p>
              <Link to="/courses" className="btn-primary mt-4 inline-block">
                Browse Courses
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
