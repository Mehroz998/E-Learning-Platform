import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { coursesAPI } from "../../api/courses";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { PlusCircle, Edit, Trash2, Layout } from "lucide-react";
import toast from "react-hot-toast";

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await coursesAPI.getMyTeachingCourses();
      setCourses(response.data.courses || []);
    } catch (error) {
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;

    try {
      await coursesAPI.deleteCourse(id);
      toast.success("Course deleted successfully");
      fetchCourses();
    } catch (error) {
      toast.error("Failed to delete course");
    }
  };

  if (loading) return <LoadingSpinner size="lg" className="min-h-screen" />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Courses</h1>
          <Link
            to="/instructor/courses/create"
            className="btn-primary flex items-center space-x-2"
          >
            <PlusCircle className="h-5 w-5" />
            <span>Create Course</span>
          </Link>
        </div>

        {courses.length > 0 ? (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-6 text-gray-600 font-medium">
                    Course
                  </th>
                  <th className="text-left py-3 px-6 text-gray-600 font-medium">
                    Status
                  </th>
                  <th className="text-left py-3 px-6 text-gray-600 font-medium">
                    Students
                  </th>
                  <th className="text-left py-3 px-6 text-gray-600 font-medium">
                    Rating
                  </th>
                  <th className="text-right py-3 px-6 text-gray-600 font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course.id} className="border-t hover:bg-gray-50">
                    <td className="py-4 px-6 font-medium">{course.title}</td>
                    <td className="py-4 px-6">
                      <span
                        className={`badge ${
                          course.status === "published"
                            ? "badge-success"
                            : "badge-warning"
                        }`}
                      >
                        {course.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {course.total_enrollments || 0}
                    </td>
                    <td className="py-4 px-6">
                      {parseFloat(course.average_rating).toFixed(1)} ⭐
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          to={`/instructor/courses/${course.id}/curriculum`}
                          className="p-2 hover:bg-gray-100 rounded text-green-600"
                          title="Curriculum"
                        >
                          <Layout className="h-4 w-4" />
                        </Link>
                        <Link
                          to={`/instructor/courses/edit/${course.id}`}
                          className="p-2 hover:bg-gray-100 rounded"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4 text-primary-600" />
                        </Link>
                        <button
                          onClick={() => handleDelete(course.id)}
                          className="p-2 hover:bg-gray-100 rounded"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">
              You haven't created any courses yet
            </p>
            <Link
              to="/instructor/courses/create"
              className="btn-primary inline-block"
            >
              Create Your First Course
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseManagement;
