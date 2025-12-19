import { useNavigate, Link } from "react-router-dom";
import { Users, BookOpen, Star, DollarSign, Award } from "lucide-react";
import StarRating from "./StarRating";
import { formatPrice, truncateText } from "../../utils/helpers";
import { LEVEL_LABELS } from "../../utils/constants";
import { coursesAPI } from "../../api/courses";
import toast from "react-hot-toast";

const CourseCard = ({ course }) => {
  const navigate = useNavigate();
  const {
    id,
    title,
    description,
    thumbnail,
    price,
    level,
    average_rating,
    total_enrollments,
    total_lessons,
    instructor_name,
  } = course;

  const getLevelColor = () => {
    const colors = {
      beginner: "bg-green-100 text-green-800",
      intermediate: "bg-yellow-100 text-yellow-800",
      advanced: "bg-red-100 text-red-800",
    };
    return colors[level] || "bg-gray-100 text-gray-800";
  };

  const handleDownloadCertificate = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (course.enrollment_id) {
      try {
        // Assuming coursesAPI is imported or available in scope
        const res = await coursesAPI.getCertificate(course.enrollment_id);
        window.open(res.data.certificate.url, "_blank");
        toast.success("Certificate downloaded!");
      } catch (err) {
        toast.error("Failed to download certificate");
      }
    } else {
      toast.error("Enrollment info missing");
    }
  };

  const handleCardClick = () => {
    // Navigate to course details by default
    navigate(`/courses/${id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="card overflow-hidden group cursor-pointer hover:shadow-md transition-shadow h-full flex flex-col"
    >
      {/* Thumbnail */}
      <div className="relative h-48 bg-gradient-to-r from-primary-400 to-secondary-400 overflow-hidden">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <BookOpen className="h-16 w-16 text-white opacity-50" />
          </div>
        )}

        {/* Level Badge */}
        <div className="absolute top-3 right-3">
          <span className={`badge ${getLevelColor()}`}>
            {LEVEL_LABELS[level] || level}
          </span>
        </div>

        {/* Price Badge */}
        <div className="absolute bottom-3 left-3">
          {price == 0 ? (
            <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
              Free
            </span>
          ) : (
            <span className="bg-white text-gray-900 px-3 py-1 rounded-full text-sm font-semibold">
              ${parseFloat(price).toFixed(2)}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition line-clamp-2">
          {title}
        </h3>

        {description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {truncateText(description, 100)}
          </p>
        )}

        {/* Instructor */}
        {instructor_name && (
          <p className="text-sm text-gray-500 mb-3">By {instructor_name}</p>
        )}

        {/* Rating & Stats */}
        <div className="flex items-center justify-between mb-3 mt-auto">
          <div className="flex items-center space-x-1">
            <StarRating rating={parseFloat(average_rating) || 0} size="sm" />
            <span className="text-sm font-medium text-gray-700">
              {parseFloat(average_rating).toFixed(1)}
            </span>
          </div>

          <div className="flex items-center space-x-3 text-sm text-gray-500">
            {total_enrollments > 0 && (
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span>{total_enrollments}</span>
              </div>
            )}
            {total_lessons > 0 && (
              <div className="flex items-center space-x-1">
                <BookOpen className="h-4 w-4" />
                <span>{total_lessons}</span>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar (if enrolled) */}
        {course.progress !== undefined && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1 text-xs">
              <span className="text-gray-500">Course Progress</span>
              <span className="font-bold text-primary-600">
                {course.progress}%
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary-600 h-full transition-all duration-500"
                style={{ width: `${course.progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* View/Certificate Button */}
        <div className="mt-4" onClick={(e) => e.stopPropagation()}>
          {course.progress === 100 ? (
            <div className="flex space-x-2">
              <Link
                to={`/courses/${id}/learn`}
                className="flex-1 btn-outline text-sm py-2 text-center"
              >
                Review
              </Link>
              <button
                onClick={handleDownloadCertificate}
                className="flex items-center justify-center space-x-1 bg-secondary-600 text-white px-3 py-2 rounded-lg text-sm font-bold hover:bg-secondary-700"
              >
                <Award className="w-4 h-4" />
                <span>Cert</span>
              </button>
            </div>
          ) : (
            <Link
              to={
                course.progress !== undefined
                  ? `/courses/${id}/learn`
                  : `/courses/${id}`
              }
              className="w-full btn-outline text-sm py-2 text-center block"
            >
              {course.progress !== undefined
                ? "Continue Learning"
                : "View Details"}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
