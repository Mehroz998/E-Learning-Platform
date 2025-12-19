import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { coursesAPI } from "../../api/courses";
import { useAuth } from "../../context/AuthContext";
import StarRating from "../../components/course/StarRating";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import {
  BookOpen,
  Users,
  Clock,
  Award,
  ChevronDown,
  ChevronUp,
  Star,
  MessageSquare,
} from "lucide-react";
import ReviewForm from "../../components/review/ReviewForm";
import { formatDuration, formatPrice, formatDate } from "../../utils/helpers";
import { LEVEL_LABELS } from "../../utils/constants";
import toast from "react-hot-toast";

const CourseDetail = () => {
  const { id } = useParams();
  const { user, isStudent } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [curriculum, setCurriculum] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    fetchCourseData();
  }, [id]);

  const fetchCourseData = async () => {
    try {
      const [courseRes, curriculumRes] = await Promise.all([
        coursesAPI.getCourseById(id),
        coursesAPI.getCourseCurriculum(id),
      ]);
      console.log(courseRes.data);
      console.log(curriculumRes.data);
      setCourse(courseRes.data.course);
      setCurriculum(curriculumRes.data.curriculum || []);

      const reviewsRes = await coursesAPI.getReviews(id);
      setReviews(reviewsRes.data.reviews || []);

      // Expand first section by default
      if (curriculumRes.data.curriculum?.length > 0) {
        setExpandedSections({ [curriculumRes.data.curriculum[0].id]: true });
      }
    } catch (error) {
      toast.error("Failed to load course");
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    setEnrolling(true);
    try {
      await coursesAPI.enrollCourse(id);
      toast.success("Successfully enrolled!");
      navigate(`/courses/${id}/learn`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Enrollment failed");
    } finally {
      setEnrolling(false);
    }
  };

  const toggleSection = (sectionId) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  if (loading) return <LoadingSpinner size="lg" className="min-h-screen" />;
  if (!course)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Course not found
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="mb-3">
                <span className="badge bg-white text-primary-600">
                  {LEVEL_LABELS[course.level]}
                </span>
              </div>
              <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
              <p className="text-xl text-primary-100 mb-6">
                {course.description}
              </p>

              <div className="flex flex-wrap items-center gap-6 text-sm">
                <div className="flex items-center space-x-2">
                  <StarRating rating={parseFloat(course.average_rating)} />
                  <span>{parseFloat(course.average_rating).toFixed(1)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>{course.total_enrollments} students</span>
                </div>
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-4w-4" />
                  <span>{course.total_lessons} lessons</span>
                </div>
                {course.total_duration > 0 && (
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>{formatDuration(course.total_duration)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Enroll Card */}
            <div className="lg:col-span-1">
              <div className="card p-6 sticky top-24">
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {formatPrice(course.price)}
                  </div>
                </div>

                {isStudent ? (
                  course.is_enrolled ? (
                    <Link
                      to={`/courses/${id}/learn`}
                      className="w-full btn-primary block text-center"
                    >
                      Continue Learning
                    </Link>
                  ) : (
                    <button
                      onClick={handleEnroll}
                      disabled={enrolling}
                      className="w-full btn-primary"
                    >
                      {enrolling ? "Enrolling..." : "Enroll Now"}
                    </button>
                  )
                ) : user ? (
                  <div className="text-center text-gray-600">
                    Only students can enroll
                  </div>
                ) : (
                  <Link
                    to="/login"
                    className="w-full btn-primary block text-center"
                  >
                    Login to Enroll
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Curriculum & Reviews */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Curriculum */}
          <div className="card p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Course Content
            </h2>
            <div className="space-y-3">
              {curriculum.map((section) => (
                <div
                  key={section.id}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center space-x-3">
                      {expandedSections[section.id] ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                      <div className="text-left">
                        <h3 className="font-semibold text-gray-900">
                          {section.title}
                        </h3>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">
                      {section.lessons?.length || 0} lessons
                    </span>
                  </button>
                  {expandedSections[section.id] && section.lessons && (
                    <div className="bg-gray-50 divide-y divide-gray-200 border-t border-gray-200">
                      {section.lessons.map((lesson, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-4 pl-12"
                        >
                          <div className="flex items-center space-x-3 text-gray-700">
                            <BookOpen className="h-4 w-4 text-gray-400" />
                            <span>{lesson.title}</span>
                          </div>
                          {lesson.duration && (
                            <span className="text-sm text-gray-500">
                              {formatDuration(lesson.duration)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Reviews Section */}
          <div className="card p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 font-display flex items-center">
              <Star className="w-6 h-6 text-yellow-500 mr-2 fill-current" />
              Student Feedback
            </h2>

            {/* If enrolled, show review form */}
            {course.is_enrolled && isStudent && (
              <div className="mb-10 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2 text-primary-600" />
                  Leave a Review
                </h3>
                <ReviewForm
                  courseId={id}
                  onReviewSubmit={() => {
                    fetchCourseData(); // Refresh reviews list
                  }}
                />
              </div>
            )}

            {reviews.length > 0 ? (
              <div className="space-y-6">
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="border-b border-gray-100 last:border-0 pb-6"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center font-bold shadow-sm">
                          {rev.student_name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 leading-tight">
                            {rev.student_name}
                          </p>
                          <p className="text-xs text-gray-400 font-medium">
                            {formatDate(rev.created_at)}
                          </p>
                        </div>
                      </div>
                      <StarRating rating={rev.rating} size={14} />
                    </div>
                    <p className="text-gray-600 italic font-medium">
                      "{rev.review}"
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="font-medium">No reviews yet for this course.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info? (Already handled by Hero card but could add more here) */}
      </div>
    </div>
  );
};

export default CourseDetail;
