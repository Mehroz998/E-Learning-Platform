import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { coursesAPI } from "../../api/courses";
import { sectionsAPI } from "../../api/sections";
import { lessonsAPI } from "../../api/lessons";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  GripVertical,
  FileText,
  Video,
  HelpCircle,
  Layout,
  PlusCircle,
  Edit2,
  CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";

const CourseCurriculum = () => {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [curriculum, setCurriculum] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({});

  // Form states for adding/editing
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [sectionFormData, setSectionFormData] = useState({
    title: "",
    description: "",
    order: 0,
  });
  const [activeSectionId, setActiveSectionId] = useState(null);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [lessonFormData, setLessonFormData] = useState({
    title: "",
    content_type: "video",
    video_url: "",
    text_content: "",
    duration: 0,
    order: 0,
  });

  useEffect(() => {
    fetchCourseAndCurriculum();
  }, [id]);

  const fetchCourseAndCurriculum = async () => {
    try {
      const [courseRes, currRes] = await Promise.all([
        coursesAPI.getCourseById(id),
        coursesAPI.getCourseCurriculum(id),
      ]);
      setCourse(courseRes.data.course);
      setCurriculum(currRes.data.curriculum || []);

      // Expand all by default for editing
      const expanded = {};
      currRes.data.curriculum?.forEach((s) => (expanded[s.id] = true));
      setExpandedSections(expanded);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (sectionId) => {
    setExpandedSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  // Section CRUD
  const handleAddSection = async (e) => {
    e.preventDefault();
    try {
      await coursesAPI.addSection(id, sectionFormData);
      toast.success("Section added!");
      setShowSectionForm(false);
      setSectionFormData({ title: "", description: "", order: 0 });
      fetchCourseAndCurriculum();
    } catch (error) {
      toast.error("Failed to add section");
    }
  };

  const handleDeleteSection = async (sectionId) => {
    if (!window.confirm("Delete this section and all its lessons?")) return;
    try {
      await sectionsAPI.deleteSection(sectionId);
      toast.success("Section deleted");
      fetchCourseAndCurriculum();
    } catch (error) {
      toast.error("Failed to delete section");
    }
  };

  // Lesson CRUD
  const handleAddLesson = async (e) => {
    e.preventDefault();
    try {
      const response = await sectionsAPI.addLesson(
        activeSectionId,
        lessonFormData
      );
      const newLesson = response.data.lesson;

      if (lessonFormData.content_type === "assignment") {
        const { assignmentsAPI } = await import("../../api/assignments");
        await assignmentsAPI.createAssignment(newLesson.id, {
          title: lessonFormData.title,
          description: lessonFormData.description,
          due_date: lessonFormData.due_date,
          max_score: parseInt(lessonFormData.max_score) || 100,
        });
      }

      toast.success("Lesson added!");
      setShowLessonForm(false);
      setLessonFormData({
        title: "",
        content_type: "video",
        video_url: "",
        text_content: "",
        duration: 0,
        order: 0,
        description: "",
        due_date: "",
        max_score: 100,
      });
      fetchCourseAndCurriculum();
    } catch (error) {
      toast.error("Failed to add lesson");
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm("Delete this lesson?")) return;
    try {
      await lessonsAPI.deleteLesson(lessonId);
      toast.success("Lesson deleted");
      fetchCourseAndCurriculum();
    } catch (error) {
      toast.error("Failed to delete lesson");
    }
  };

  if (loading) return <LoadingSpinner size="lg" className="min-h-screen" />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <nav className="flex text-sm text-gray-500 mb-2">
              <Link
                to="/instructor/courses"
                className="hover:text-primary-600 transition"
              >
                My Courses
              </Link>
              <span className="mx-2">/</span>
              <span className="text-gray-900 font-medium">Curriculum</span>
            </nav>
            <h1 className="text-3xl font-bold text-gray-900">
              {course?.title}
            </h1>
          </div>
          <button
            onClick={() => setShowSectionForm(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Add Section</span>
          </button>
        </div>

        {/* Section Form Modal-like */}
        {showSectionForm && (
          <div className="card p-6 mb-8 border-2 border-primary-200">
            <h3 className="text-xl font-bold mb-4">Add New Section</h3>
            <form onSubmit={handleAddSection} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Section Title
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={sectionFormData.title}
                  onChange={(e) =>
                    setSectionFormData({
                      ...sectionFormData,
                      title: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  className="input-field"
                  value={sectionFormData.description}
                  onChange={(e) =>
                    setSectionFormData({
                      ...sectionFormData,
                      description: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex space-x-3">
                <button type="submit" className="btn-primary flex-1">
                  Save Section
                </button>
                <button
                  type="button"
                  onClick={() => setShowSectionForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Curriculum List */}
        <div className="space-y-4">
          {curriculum.length === 0 && !showSectionForm && (
            <div className="card p-12 text-center text-gray-500">
              <Layout className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg">
                No sections yet. Start by adding a section.
              </p>
            </div>
          )}

          {curriculum.map((section, index) => (
            <div key={section.id} className="card overflow-hidden shadow-sm">
              <div className="bg-white p-4 border-b flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="text-gray-400 hover:text-gray-600 transition"
                  >
                    {expandedSections[section.id] ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </button>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400 font-mono text-xs uppercase tracking-wider">
                      Section {index + 1}:
                    </span>
                    <h3 className="font-bold text-gray-800 text-lg">
                      {section.title}
                    </h3>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setActiveSectionId(section.id);
                      setShowLessonForm(true);
                      setLessonFormData({
                        title: "",
                        content_type: "video",
                        video_url: "",
                        text_content: "",
                        duration: 0,
                        order: 0,
                        description: "",
                        due_date: "",
                        max_score: 100,
                      });
                    }}
                    className="p-2 text-primary-600 hover:bg-primary-50 rounded-full transition"
                    title="Add Lesson"
                  >
                    <PlusCircle className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteSection(section.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-full transition"
                    title="Delete Section"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {expandedSections[section.id] && (
                <div className="p-2 bg-gray-50/50">
                  {/* Lesson Form */}
                  {showLessonForm && activeSectionId === section.id && (
                    <div className="m-2 p-4 bg-white border border-primary-200 rounded-lg shadow-sm mb-4">
                      <h4 className="font-bold mb-4 flex items-center">
                        <Plus className="h-4 w-4 mr-2" /> Add New Content
                      </h4>
                      <form onSubmit={handleAddLesson} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                              Title
                            </label>
                            <input
                              type="text"
                              className="input-field"
                              value={lessonFormData.title}
                              onChange={(e) =>
                                setLessonFormData({
                                  ...lessonFormData,
                                  title: e.target.value,
                                })
                              }
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                              Type
                            </label>
                            <select
                              className="input-field"
                              value={lessonFormData.content_type}
                              onChange={(e) =>
                                setLessonFormData({
                                  ...lessonFormData,
                                  content_type: e.target.value,
                                })
                              }
                            >
                              <option value="video">Video</option>
                              <option value="text">Article/Text</option>
                              <option value="quiz">Quiz</option>
                              <option value="assignment">Assignment</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                              Duration (min)
                            </label>
                            <input
                              type="number"
                              className="input-field"
                              value={lessonFormData.duration}
                              onChange={(e) =>
                                setLessonFormData({
                                  ...lessonFormData,
                                  duration: parseInt(e.target.value) || 0,
                                })
                              }
                              min="0"
                            />
                          </div>
                          {lessonFormData.content_type === "video" && (
                            <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                Video URL (YouTube/Vimeo)
                              </label>
                              <input
                                type="text"
                                className="input-field"
                                value={lessonFormData.video_url}
                                onChange={(e) =>
                                  setLessonFormData({
                                    ...lessonFormData,
                                    video_url: e.target.value,
                                  })
                                }
                                required={
                                  lessonFormData.content_type === "video"
                                }
                                placeholder="https://..."
                              />
                            </div>
                          )}
                          {lessonFormData.content_type === "text" && (
                            <div className="col-span-2">
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                Text Content
                              </label>
                              <textarea
                                className="input-field h-32"
                                value={lessonFormData.text_content}
                                onChange={(e) =>
                                  setLessonFormData({
                                    ...lessonFormData,
                                    text_content: e.target.value,
                                  })
                                }
                                required={
                                  lessonFormData.content_type === "text"
                                }
                              />
                            </div>
                          )}
                          {lessonFormData.content_type === "assignment" && (
                            <>
                              <div className="col-span-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                  Assignment Description
                                </label>
                                <textarea
                                  className="input-field h-32"
                                  value={lessonFormData.description || ""}
                                  onChange={(e) =>
                                    setLessonFormData({
                                      ...lessonFormData,
                                      description: e.target.value,
                                    })
                                  }
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                  Due Date
                                </label>
                                <input
                                  type="date"
                                  className="input-field"
                                  value={lessonFormData.due_date || ""}
                                  onChange={(e) =>
                                    setLessonFormData({
                                      ...lessonFormData,
                                      due_date: e.target.value,
                                    })
                                  }
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                  Max Score
                                </label>
                                <input
                                  type="number"
                                  className="input-field"
                                  value={lessonFormData.max_score || 100}
                                  onChange={(e) =>
                                    setLessonFormData({
                                      ...lessonFormData,
                                      max_score:
                                        parseInt(e.target.value) || 100,
                                    })
                                  }
                                  required
                                />
                              </div>
                            </>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <button
                            type="submit"
                            className="btn-primary py-2 px-4 text-sm"
                          >
                            Add Content
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowLessonForm(false)}
                            className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Lessons List */}
                  <div className="space-y-2">
                    {(!section.lessons || section.lessons.length === 0) &&
                      !showLessonForm && (
                        <div className="p-4 text-center text-gray-400 text-sm italic">
                          No lessons in this section yet.
                        </div>
                      )}
                    {section.lessons?.map((lesson, lIdx) => (
                      <div
                        key={lesson.id}
                        className="group bg-white p-3 mx-2 rounded border border-transparent hover:border-gray-200 hover:shadow-sm transition flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <GripVertical className="h-4 w-4 text-gray-300 group-hover:text-gray-400 cursor-move" />
                          <div className="p-2 bg-gray-50 rounded">
                            {lesson.content_type === "video" ? (
                              <Video className="h-4 w-4 text-primary-500" />
                            ) : lesson.content_type === "quiz" ? (
                              <HelpCircle className="h-4 w-4 text-orange-500" />
                            ) : (
                              <FileText className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                          <div>
                            <span className="text-gray-400 text-xs mr-2 font-medium">
                              {lIdx + 1}.
                            </span>
                            <span className="text-sm font-medium text-gray-700">
                              {lesson.title}
                            </span>
                            <span className="ml-2 px-1.5 py-0.5 bg-gray-100 text-[10px] uppercase font-bold text-gray-500 rounded">
                              {lesson.content_type}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition">
                          {lesson.content_type === "quiz" && (
                            <Link
                              to={`/instructor/quizzes/create/${lesson.id}`}
                              className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded transition"
                              title="Manage Quiz"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Link>
                          )}
                          {lesson.content_type === "assignment" &&
                            lesson.assignment_id && (
                              <Link
                                to={`/instructor/assignments/${lesson.assignment_id}/grade`}
                                className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition"
                                title="Grade Submissions"
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                              </Link>
                            )}
                          <button
                            onClick={() => handleDeleteLesson(lesson.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition"
                            title="Delete Lesson"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CourseCurriculum;
