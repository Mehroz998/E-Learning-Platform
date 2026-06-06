import { useState, useEffect } from "react";
import { coursesAPI } from "../../api/courses";
import CourseCard from "../../components/course/CourseCard";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const MyLearning = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyCourses();
  }, []);

  const fetchMyCourses = async () => {
    try {
      const response = await coursesAPI.getMyCoursers();
      setCourses(response.data.courses || []);
    } catch (error) {
      console.error("Failed to fetch courses");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" className="min-h-screen" />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Learning</h1>

        {courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="card p-12 text-center">
            <p className="text-gray-500 text-lg">
              You haven't enrolled in any courses yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyLearning;
