import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { lessonsAPI } from "../../api/lessons";
import { quizzesAPI } from "../../api/quizzes";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import {
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  CheckCircle2,
  Circle,
  HelpCircle,
} from "lucide-react";
import toast from "react-hot-toast";

const QuizBuilder = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lesson, setLesson] = useState(null);

  const [quizData, setQuizData] = useState({
    title: "",
    time_limit: 30,
    passing_score: 70,
    questions: [],
  });

  useEffect(() => {
    fetchLessonAndQuiz();
  }, [lessonId]);

  const fetchLessonAndQuiz = async () => {
    try {
      const lessonRes = await lessonsAPI.getLesson(lessonId);
      setLesson(lessonRes.data.lesson);

      // Try to fetch existing quiz
      const quizRes = await lessonsAPI.getQuiz(lessonId);
      if (quizRes.data && quizRes.data.quiz) {
        const quiz = quizRes.data.quiz;
        const questions = quizRes.data.questions.map((q) => ({
          question_text: q.question,
          options: [q.option_a, q.option_b, q.option_c, q.option_d],
          correct_answer: q.correct_answer,
          points: q.points,
        }));

        setQuizData({
          title: quiz.title,
          time_limit: quiz.time_limit,
          passing_score: quiz.passing_score,
          questions: questions,
        });
      } else {
        // New quiz setup
        setQuizData((prev) => ({
          ...prev,
          title: `Quiz: ${lessonRes.data.lesson.title}`,
        }));
      }
    } catch (error) {
      toast.error("Failed to load data");
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = () => {
    setQuizData({
      ...quizData,
      questions: [
        ...quizData.questions,
        {
          question_text: "",
          options: ["", "", "", ""],
          correct_answer: "A", // Default to 'A'
          points: 1,
        },
      ],
    });
  };

  const removeQuestion = (index) => {
    const newQuestions = [...quizData.questions];
    newQuestions.splice(index, 1);
    setQuizData({ ...quizData, questions: newQuestions });
  };

  const handleQuestionChange = (index, value) => {
    const newQuestions = [...quizData.questions];
    newQuestions[index].question_text = value;
    setQuizData({ ...quizData, questions: newQuestions });
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const newQuestions = [...quizData.questions];
    newQuestions[qIndex].options[oIndex] = value;
    setQuizData({ ...quizData, questions: newQuestions });
  };

  const handleCorrectAnswer = (qIndex, letter) => {
    const newQuestions = [...quizData.questions];
    newQuestions[qIndex].correct_answer = letter;
    setQuizData({ ...quizData, questions: newQuestions });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (quizData.questions.length === 0) {
      toast.error("Please add at least one question");
      return;
    }

    // Basic validation
    for (const q of quizData.questions) {
      if (!q.question_text || q.options.some((o) => !o) || !q.correct_answer) {
        toast.error(
          "Please fill all question details and select a correct answer"
        );
        return;
      }
    }

    setSaving(true);
    try {
      // Transform data for backend
      const transformedData = {
        ...quizData,
        questions: quizData.questions.map((q, idx) => ({
          question: q.question_text,
          option_a: q.options[0],
          option_b: q.options[1],
          option_c: q.options[2],
          option_d: q.options[3],
          correct_answer: q.correct_answer,
          points: q.points || 1,
          order_index: idx,
        })),
      };

      await lessonsAPI.addQuiz(lessonId, transformedData);
      toast.success("Quiz created successfully!");
      navigate(-1);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create quiz");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" className="min-h-screen" />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-white rounded-full transition text-gray-600"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Quiz Creator</h1>
          </div>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="btn-primary flex items-center space-x-2 px-6"
          >
            <Save className="h-5 w-5" />
            <span>{saving ? "Saving..." : "Save Quiz"}</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Quiz Settings */}
          <div className="card p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center">
              <HelpCircle className="h-5 w-5 mr-2 text-primary-600" />
              General Settings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quiz Title
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={quizData.title}
                  onChange={(e) =>
                    setQuizData({ ...quizData, title: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time Limit (mins)
                </label>
                <input
                  type="number"
                  className="input-field"
                  value={quizData.time_limit}
                  onChange={(e) =>
                    setQuizData({
                      ...quizData,
                      time_limit: parseInt(e.target.value),
                    })
                  }
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Passing Score (%)
                </label>
                <input
                  type="number"
                  className="input-field"
                  value={quizData.passing_score}
                  onChange={(e) =>
                    setQuizData({
                      ...quizData,
                      passing_score: parseInt(e.target.value),
                    })
                  }
                  min="1"
                  max="100"
                />
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">
                Questions ({quizData.questions.length})
              </h2>
              <button
                type="button"
                onClick={addQuestion}
                className="text-primary-600 font-bold hover:text-primary-700 flex items-center space-x-1"
              >
                <Plus className="h-4 w-4" />
                <span>Add Question</span>
              </button>
            </div>

            {quizData.questions.map((question, qIndex) => (
              <div key={qIndex} className="card p-6 relative group">
                <button
                  type="button"
                  onClick={() => removeQuestion(qIndex)}
                  className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition"
                >
                  <Trash2 className="h-5 w-5" />
                </button>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                      Question {qIndex + 1}
                    </label>
                    <textarea
                      className="input-field"
                      placeholder="What is the capital of..."
                      value={question.question_text}
                      onChange={(e) =>
                        handleQuestionChange(qIndex, e.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {question.options.map((option, oIndex) => (
                      <div key={oIndex} className="relative">
                        <input
                          type="text"
                          className={`input-field pr-10 ${
                            question.correct_answer === option && option !== ""
                              ? "border-green-500 bg-green-50 ring-1 ring-green-500"
                              : ""
                          }`}
                          placeholder={`Option ${String.fromCharCode(
                            65 + oIndex
                          )}`}
                          value={option}
                          onChange={(e) =>
                            handleOptionChange(qIndex, oIndex, e.target.value)
                          }
                          required
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handleCorrectAnswer(
                              qIndex,
                              String.fromCharCode(65 + oIndex)
                            )
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                          {question.correct_answer ===
                          String.fromCharCode(65 + oIndex) ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-300 hover:text-gray-400" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {quizData.questions.length === 0 && (
              <div className="p-12 text-center bg-white rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-500">
                  No questions added yet. Click "Add Question" to begin.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={addQuestion}
              className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-bold hover:bg-white hover:border-primary-300 hover:text-primary-600 transition flex items-center justify-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Add New Question</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuizBuilder;
