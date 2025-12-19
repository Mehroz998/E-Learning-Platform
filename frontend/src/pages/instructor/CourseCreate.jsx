import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { coursesAPI } from "../../api/courses";
import { categoriesAPI } from "../../api/categories";
import { Upload, Loader } from "lucide-react";
import toast from "react-hot-toast";

const CourseCreateEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // If id exists, we're in edit mode
  const isEditMode = Boolean(id);

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingCourse, setFetchingCourse] = useState(isEditMode);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category_id: "",
    level: "beginner",
    price: "",
    status: "draft",
    thumbnail: null,
  });
  const [thumbnailPreview, setThumbnailPreview] = useState(null);

  useEffect(() => {
    fetchCategories();
    if (isEditMode) {
      fetchCourseData();
    }
  }, [id]);

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAllCategories();
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error("Failed to load categories");
    }
  };

  const fetchCourseData = async () => {
    try {
      const response = await coursesAPI.getCourseById(id);
      const course = response.data.course;

      setFormData({
        title: course.title || "",
        description: course.description || "",
        category_id: course.category_id || "",
        level: course.level || "beginner",
        price: course.price || "",
        status: course.status || "draft",
        thumbnail: null,
      });

      if (course.thumbnail) {
        setThumbnailPreview(course.thumbnail);
      }
    } catch (error) {
      toast.error("Failed to load course data");
      navigate("/instructor/courses");
    } finally {
      setFetchingCourse(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, thumbnail: file });
      const reader = new FileReader();
      reader.onloadend = () => setThumbnailPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditMode) {
        await coursesAPI.updateCourse(id, formData);
        toast.success("Course updated successfully!");
      } else {
        await coursesAPI.createCourse(formData);
        toast.success("Course created successfully!");
      }
      navigate("/instructor/courses");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          `Failed to ${isEditMode ? "update" : "create"} course`
      );
    } finally {
      setLoading(false);
    }
  };

  if (fetchingCourse) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="card p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            {isEditMode ? "Edit Course" : "Create New Course"}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Thumbnail */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Thumbnail
              </label>
              <div className="flex items-center space-x-4">
                {thumbnailPreview && (
                  <img
                    src={thumbnailPreview}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                )}
                <label className="btn-outline cursor-pointer">
                  <Upload className="h-4 w-4 inline mr-2" />
                  {thumbnailPreview ? "Change Image" : "Choose Image"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="e.g., Complete Web Development Bootcamp"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows="4"
                className="input-field"
                placeholder="Describe what students will learn..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  required
                  className="input-field"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Level
                </label>
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price ($)
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className="input-field"
                  placeholder="0.00"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>

            {/* Submit */}
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1"
              >
                {loading ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin inline mr-2" />
                    {isEditMode ? "Updating..." : "Creating..."}
                  </>
                ) : isEditMode ? (
                  "Update Course"
                ) : (
                  "Create Course"
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate("/instructor/courses")}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CourseCreateEdit;
