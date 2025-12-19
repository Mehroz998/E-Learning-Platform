// Simplified CoursePlayer - can be expanded with actual video player and lesson content
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { coursesAPI } from "../../api/courses";
import { lessonsAPI } from "../../api/lessons";
import { quizzesAPI } from "../../api/quizzes";
import { assignmentsAPI } from "../../api/assignments";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { formatDuration, getEmbedUrl } from "../../utils/helpers";
import { Check, PlayCircle, Info, Save, Clock, Award } from "lucide-react";
import toast from "react-hot-toast";

const CoursePlayer = () => {
  const { id } = useParams();
  const [curriculum, setCurriculum] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [reviews, setReviews] = useState([]);

  // Quiz specific states
  const [quizData, setQuizData] = useState(null);
  const [studentAnswers, setStudentAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Assignment states
  const [assignmentData, setAssignmentData] = useState(null);
  const [assignmentContent, setAssignmentContent] = useState("");
  const [assignmentFile, setAssignmentFile] = useState("");
  const [submissionResult, setSubmissionResult] = useState(null);
  const [enrollment, setEnrollment] = useState(null); // Added enrollment state

  useEffect(() => {
    fetchCurriculum();
  }, [id]);

  useEffect(() => {
    if (currentLesson?.content_type === "quiz") {
      fetchQuiz(currentLesson.id);
    } else if (currentLesson?.content_type === "assignment") {
      fetchAssignment(currentLesson.id);
    } else {
      setQuizData(null);
      setQuizResult(null);
      setStudentAnswers({});
      setAssignmentData(null);
      setSubmissionResult(null);
    }
  }, [currentLesson?.id]);

  const fetchQuiz = async (lessonId) => {
    try {
      const response = await lessonsAPI.getQuiz(lessonId);
      // Backend returns { status: 'success', data: { quiz, questions } }
      setQuizData(response.data);
    } catch (error) {
      console.error("Failed to load quiz", error);
      toast.error("Failed to load quiz content");
    }
  };

  const fetchAssignment = async (lessonId) => {
    try {
      const response = await lessonsAPI.getAssignment(lessonId);
      setAssignmentData(response.data.assignment);
      // New: handle student submission if returned by backend
      if (response.data.submission) {
        setSubmissionResult(response.data.submission);
        setAssignmentContent(response.data.submission.content || "");
        setAssignmentFile(response.data.submission.file_url || "");
      } else {
        setSubmissionResult(null);
        setAssignmentContent("");
        setAssignmentFile("");
      }
    } catch (error) {
      toast.error("Failed to load assignment");
    }
  };

  const fetchCurriculum = async () => {
    try {
      const response = await coursesAPI.getCourseCurriculum(id);
      const curr = response.data.curriculum || [];
      setCurriculum(curr);
      setEnrollment(response.data.enrollment || null); // Store enrollment info

      // Set first lesson as current
      if (curr.length > 0 && curr[0].lessons?.length > 0) {
        const firstLesson = curr[0].lessons[0];
        setCurrentLesson(firstLesson);
        if (firstLesson.content_type === "quiz") {
          fetchQuiz(firstLesson.id);
        } else if (firstLesson.content_type === "assignment") {
          fetchAssignment(firstLesson.id);
        }
      }
    } catch (error) {
      toast.error("Failed to load course");
    } finally {
      setLoading(false);
    }
  };

  const markComplete = async () => {
    if (!currentLesson || currentLesson.is_completed) return;
    try {
      const response = await lessonsAPI.markComplete(currentLesson.id);
      toast.success("Lesson marked as complete!");

      // Update local state
      const updatedCurriculum = curriculum.map((section) => ({
        ...section,
        lessons: section.lessons.map((lesson) =>
          lesson.id === currentLesson.id
            ? { ...lesson, is_completed: true }
            : lesson
        ),
      }));
      setCurriculum(updatedCurriculum);
      setCurrentLesson((prev) => ({ ...prev, is_completed: true }));

      // Update enrollment progress from backend response
      if (response.data && response.data.enrollment) {
        setEnrollment(response.data.enrollment);
      }
    } catch (error) {
      toast.error("Failed to mark lesson complete");
    }
  };

  const handleOptionSelect = (questionId, option) => {
    setStudentAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
  };

  const handleQuizSubmit = async () => {
    if (!quizData || !quizData.quiz) return;

    // Validate all questions answered
    if (Object.keys(studentAnswers).length < quizData.questions.length) {
      toast.error("Please answer all questions before submitting");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await quizzesAPI.submitQuiz(
        quizData.quiz.id,
        studentAnswers
      );

      setQuizResult(result.data);
      toast.success(
        result.data.passed
          ? "Congratulations! You passed."
          : "Quiz submitted. You need a higher score to pass."
      );

      if (result.data.passed) {
        markComplete();
      }
    } catch (error) {
      toast.error("Failed to submit quiz");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignmentSubmit = async () => {
    if (!assignmentData) return;
    if (!assignmentContent && !assignmentFile) {
      toast.error("Please provide content or a file URL");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await assignmentsAPI.submitAssignment(
        assignmentData.id,
        {
          content: assignmentContent,
          file_url: assignmentFile,
        }
      );

      setSubmissionResult(response.data);
      toast.success("Assignment submitted successfully!");
      markComplete();
    } catch (error) {
      toast.error("Failed to submit assignment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadCertificate = async () => {
    if (!enrollment || enrollment.progress < 100) {
      toast.error("Complete all lessons to download your certificate!");
      return;
    }
    try {
      const res = await coursesAPI.getCertificate(enrollment.id);
      // In a real app, you'd open the PDF URL. For now, we'll notify and show the ID.
      toast.success(`Certificate Generated: ${res.data.certificate.id}`);
      window.open(res.data.certificate.url, "_blank");
    } catch (error) {
      toast.error("Failed to generate certificate");
    }
  };

  if (loading) return <LoadingSpinner size="lg" className="min-h-screen" />;

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar - Lessons */}
      <div className="w-80 bg-white overflow-y-auto border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Course Content</h2>
          {Number(enrollment?.progress) >= 100 && (
            <button
              onClick={handleDownloadCertificate}
              className="flex items-center space-x-2 px-3 py-1.5 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 transition-all shadow-sm active:scale-95 text-xs font-bold"
              title="Download Certificate"
            >
              <Award className="h-4 w-4" />
              <span>Certificate</span>
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          {curriculum.map((section) => (
            <div key={section.id} className="border-b border-gray-100">
              <div className="p-4 bg-gray-50 font-medium text-gray-900 text-sm">
                {section.title}
              </div>
              {section.lessons?.map((lesson) => (
                <button
                  key={lesson.id}
                  onClick={() => setCurrentLesson(lesson)}
                  className={`w-full text-left p-4 hover:bg-gray-50 flex items-center justify-between border-l-4 transition-colors ${
                    currentLesson?.id === lesson.id
                      ? "bg-primary-50 border-primary-600 text-primary-700 font-medium"
                      : "border-transparent text-gray-600"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {lesson.is_completed ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <PlayCircle className="h-4 w-4 text-gray-400" />
                    )}
                    <span className="text-sm line-clamp-1">{lesson.title}</span>
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-white">
        {currentLesson ? (
          <>
            {/* Player/Content View (Top Part) */}
            {/* Player/Content View (Top Part) */}
            {currentLesson.content_type === "video" &&
            currentLesson.video_url ? (
              <div className="bg-black flex items-center justify-center relative shadow-2xl z-20 aspect-video w-full">
                <iframe
                  src={getEmbedUrl(currentLesson.video_url)}
                  className="w-full h-full"
                  allowFullScreen
                />
              </div>
            ) : currentLesson.content_type === "quiz" && quizData ? (
              <div className="w-full bg-gray-50 flex flex-col h-[calc(100vh-140px)] overflow-hidden">
                <div className="flex-1 w-full max-w-4xl mx-auto p-8 flex flex-col overflow-y-auto">
                  {quizData.quiz ? (
                    <>
                      <div className="mb-8 border-b border-gray-200 pb-6 flex items-center justify-between">
                        <div>
                          <h2 className="text-3xl font-bold text-gray-900 mb-2">
                            {quizData.quiz.title}
                          </h2>
                          <p className="text-gray-500 text-sm">
                            Passing Score: {quizData.quiz.passing_score}% •{" "}
                            {quizData.questions?.length || 0} Questions
                          </p>
                        </div>
                        {quizResult && (
                          <div
                            className={`px-4 py-2 rounded-lg font-bold ${
                              quizResult.passed
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {quizResult.percentage}% -{" "}
                            {quizResult.passed ? "PASSED" : "FAILED"}
                          </div>
                        )}
                      </div>

                      <div className="space-y-8">
                        {quizData.questions.map((q, qIdx) => (
                          <div
                            key={q.id}
                            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
                          >
                            <h4 className="text-xl text-gray-900 font-bold mb-6 flex items-start">
                              <span className="bg-primary-50 text-primary-600 w-8 h-8 rounded-lg flex items-center justify-center mr-4 flex-shrink-0 text-sm font-bold">
                                {qIdx + 1}
                              </span>
                              {q.question}
                            </h4>
                            <div className="grid grid-cols-1 gap-3 ml-12">
                              {["a", "b", "c", "d"].map((letter) => {
                                const upperLetter = letter.toUpperCase();
                                const optionKey = `option_${letter}`;
                                const isSelected =
                                  studentAnswers[q.id] === upperLetter;

                                return (
                                  <button
                                    key={letter}
                                    onClick={() =>
                                      !quizResult &&
                                      handleOptionSelect(q.id, upperLetter)
                                    }
                                    disabled={!!quizResult}
                                    className={`group p-4 rounded-xl border-2 text-left transition-all duration-200 flex items-center space-x-4 ${
                                      isSelected
                                        ? "border-primary-500 bg-primary-50 text-primary-700"
                                        : "border-gray-100 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                                    }`}
                                  >
                                    <span
                                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors ${
                                        isSelected
                                          ? "border-primary-500 bg-primary-500 text-white"
                                          : "border-gray-300 group-hover:border-gray-400"
                                      }`}
                                    >
                                      {upperLetter}
                                    </span>
                                    <span className="flex-1 font-medium">
                                      {q[optionKey]}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 italic">
                      <PlayCircle className="h-12 w-12 mb-4 opacity-20" />
                      <p>No questions found for this quiz.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : currentLesson.content_type === "assignment" ? (
              <div className="w-full bg-gray-50 flex flex-col h-[calc(100vh-140px)] overflow-hidden">
                <div className="flex-1 w-full max-w-4xl mx-auto p-8 flex flex-col overflow-y-auto">
                  {assignmentData ? (
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                      <div className="mb-8 border-b border-gray-100 pb-6">
                        <span className="text-xs font-bold tracking-wider text-primary-600 uppercase mb-2 block">
                          Assignment
                        </span>
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                          {assignmentData.title}
                        </h2>
                        <p className="text-gray-600 mb-6 leading-relaxed">
                          {assignmentData.description}
                        </p>
                        <div className="flex items-center space-x-6 text-sm text-gray-500 bg-gray-50 p-4 rounded-xl">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span>
                              Due:{" "}
                              <span className="font-semibold text-gray-700">
                                {new Date(
                                  assignmentData.due_date
                                ).toLocaleDateString()}
                              </span>
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Award className="w-4 h-4 text-gray-400" />
                            <span>
                              Max Score:{" "}
                              <span className="font-semibold text-gray-700">
                                {assignmentData.max_score}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {submissionResult ? (
                        <div className="space-y-6">
                          <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-xl text-emerald-800 text-center">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <Check className="w-8 h-8 text-emerald-600" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">
                              Assignment Submitted
                            </h3>
                            <p className="text-emerald-600">
                              You submitted this on{" "}
                              {new Date(
                                submissionResult.submitted_at
                              ).toLocaleString()}
                            </p>
                          </div>

                          {submissionResult.graded_at && (
                            <div className="bg-primary-50 border border-primary-100 p-6 rounded-xl">
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="font-bold text-primary-900 flex items-center gap-2">
                                  <Award className="w-5 h-5" /> Instructor Grade
                                </h4>
                                <span className="px-3 py-1 bg-primary-600 text-white rounded-full text-sm font-bold">
                                  {submissionResult.grade} /{" "}
                                  {assignmentData.max_score}
                                </span>
                              </div>
                              <p className="text-primary-800 text-sm italic">
                                "
                                {submissionResult.feedback ||
                                  "No feedback provided."}
                                "
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                              Submission Content
                            </label>
                            <textarea
                              value={assignmentContent}
                              onChange={(e) =>
                                setAssignmentContent(e.target.value)
                              }
                              className="w-full h-48 bg-white border border-gray-200 rounded-xl p-4 text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition shadow-sm"
                              placeholder="Write your answer here..."
                            ></textarea>
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                              File URL (Optional)
                            </label>
                            <input
                              type="text"
                              value={assignmentFile}
                              onChange={(e) =>
                                setAssignmentFile(e.target.value)
                              }
                              className="w-full bg-white border border-gray-200 rounded-xl p-4 text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition shadow-sm"
                              placeholder="https://..."
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 italic">
                      <p>Loading assignment details...</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Text Content / Fallback
              <div className="w-full bg-gray-50 flex flex-col h-[calc(100vh-140px)] overflow-hidden">
                <div className="flex-1 w-full max-w-4xl mx-auto p-8 flex flex-col overflow-y-auto">
                  {currentLesson.text_content ? (
                    <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100 min-h-[500px]">
                      <h1 className="text-4xl font-bold text-gray-900 mb-8">
                        {currentLesson.title}
                      </h1>
                      <div
                        className="prose prose-lg prose-blue max-w-none text-gray-600 leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html: currentLesson.text_content,
                        }}
                      />
                    </div>
                  ) : (
                    <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100 text-center py-20">
                      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Info className="w-10 h-10 text-gray-300" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Content Unavailable
                      </h3>
                      <p className="text-gray-500">
                        This lesson content cannot be displayed or is missing.
                      </p>
                      <p className="text-xs text-gray-400 mt-4">
                        Type: {currentLesson.content_type || "Unknown"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Content Tabs & Info (Scrollable Bottom) */}
            <div className="flex-1 overflow-y-auto bg-gray-50/50">
              {/* Controls Bar */}
              <div className="sticky top-0 bg-white/95 backdrop-blur-md p-6 border-b border-gray-200 flex items-center justify-between shadow-sm z-30">
                <div className="flex items-center space-x-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-primary-600 uppercase tracking-widest mb-1">
                      LECTURE
                    </span>
                    <h3 className="font-bold text-xl text-gray-900 line-clamp-1">
                      {currentLesson.title}
                    </h3>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {currentLesson.content_type === "quiz" ? (
                    <button
                      onClick={handleQuizSubmit}
                      disabled={isSubmitting || !!quizResult}
                      className={`flex items-center space-x-2 px-8 py-3 rounded-xl font-bold transition-all duration-300 shadow-md active:scale-95 group ${
                        quizResult
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default"
                          : "bg-primary-600 text-white hover:bg-primary-700 hover:shadow-primary-300/50"
                      }`}
                    >
                      <Save className="h-5 w-5" />
                      <span>
                        {isSubmitting
                          ? "Submitting..."
                          : quizResult
                          ? "Quiz Submitted"
                          : "Submit Quiz"}
                      </span>
                    </button>
                  ) : currentLesson.content_type === "assignment" ? (
                    <button
                      onClick={handleAssignmentSubmit}
                      disabled={isSubmitting || submissionResult}
                      className={`flex items-center space-x-2 px-8 py-3 rounded-xl font-bold transition-all duration-300 shadow-md active:scale-95 group ${
                        submissionResult
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default"
                          : "bg-primary-600 text-white hover:bg-primary-700 hover:shadow-primary-300/50"
                      }`}
                    >
                      <Save className="h-5 w-5" />
                      <span>
                        {isSubmitting
                          ? "Submitting..."
                          : submissionResult
                          ? "Submitted"
                          : "Submit Assignment"}
                      </span>
                    </button>
                  ) : (
                    <button
                      onClick={markComplete}
                      disabled={currentLesson.is_completed}
                      className={`flex items-center space-x-2 px-8 py-3 rounded-xl font-bold transition-all duration-300 shadow-md active:scale-95 group ${
                        currentLesson.is_completed
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default"
                          : "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-300/50"
                      }`}
                    >
                      <Check
                        className={`h-5 w-5 transition-transform group-hover:scale-110 ${
                          currentLesson.is_completed ? "text-emerald-500" : ""
                        }`}
                      />
                      <span>
                        {currentLesson.is_completed
                          ? "Completed"
                          : "Mark Complete"}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50 italic">
            <PlayCircle className="w-20 h-20 mb-6 text-gray-200" />
            <span className="text-xl font-bold tracking-tight">
              Select a lesson to start learning your future
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoursePlayer;
