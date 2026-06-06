import { useState, useEffect } from "react";
import { coursesAPI } from "../../api/courses";
import { categoriesAPI } from "../../api/categories";
import CourseCard from "../../components/course/CourseCard";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { Search, Filter, X } from "lucide-react";
import { useDebounce } from "../../hooks/useDebounce";

const CourseBrowse = () => {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    category: "",
    level: "",
    sort: "newest",
  });

  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [debouncedSearch, filters]);

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAllCategories();
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error("Failed to fetch categories");
    }
  };

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const params = {
        search: debouncedSearch,
        category: filters.category,
        level: filters.level,
        sort: filters.sort,
      };
      const response = await coursesAPI.getAllCourses(params);
      setCourses(response.data.courses || []);
    } catch (error) {
      console.error("Failed to fetch courses");
    } finally {
      setLoading(false);
    }
  };

  const hasActiveFilters = filters.category || filters.level || searchTerm;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Explore Courses
          </h1>
          <p className="text-gray-600">Discover your next learning adventure</p>
        </div>

        {/* Search & Filters */}
        <div className="card p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Search */}
            <div className="lg:col-span-2 relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search courses..."
                className="input-field pl-10"
              />
            </div>

            {/* Level Filter */}
            <select
              value={filters.level}
              onChange={(e) =>
                setFilters({ ...filters, level: e.target.value })
              }
              className="input-field"
            >
              <option value="">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          {/* Active Filters & Sort */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="flex items-center space-x-2">
              {hasActiveFilters && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setFilters({ category: "", level: "", sort: "newest" });
                  }}
                  className="text-sm text-red-600 hover:text-red-700 flex items-center space-x-1"
                >
                  <X className="h-4 w-4" />
                  <span>Clear Filters</span>
                </button>
              )}
            </div>

            <select
              value={filters.sort}
              onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
              className="input-field w-auto text-sm"
            >
              <option value="newest">Newest First</option>
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>

        {/* Courses Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : courses.length > 0 ? (
          <>
            <div className="mb-4 text-gray-600">
              Found {courses.length} course{courses.length !== 1 ? "s" : ""}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </>
        ) : (
          <div className="card p-12 text-center">
            <p className="text-gray-500 text-lg">
              No courses found. Try adjusting your filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseBrowse;
