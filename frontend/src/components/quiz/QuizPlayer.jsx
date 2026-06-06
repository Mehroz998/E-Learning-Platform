import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { quizzesAPI } from "../../api/quizzes";
import LoadingSpinner from "../common/LoadingSpinner";
import { Clock, CheckCircle, XCircle } from "lucide-react";
import toast from "react-hot-toast";

const QuizPlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState(null);

  useEffect(() => {
    startQuiz();
  }, [id]);

  const startQuiz = async () => {
    try {
      const response = await quizzesAPI.attemptQuiz(id);
      setQuiz(response.data.quiz);
      setQuestions(response.data.questions || []);
    } catch (error) {
      toast.error("Failed to load quiz");
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      toast.error("Please answer all questions");
      return;
    }

    setSubmitting(true);
    try {
      const response = await quizzesAPI.submitQuiz(id, answers);
      setResults(response.data.results);
      toast.success(`Quiz submitted! Score: ${response.data.results.score}%`);
    } catch (error) {
      toast.error("Failed to submit quiz");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" className="min-h-screen" />;

  if (results) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <div className="card p-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Quiz Results
            </h1>
            <div className="text-6xl font-bold text-primary-600 mb-4">
              {results.score}%
            </div>
            <p className="text-gray-600 mb-6">
              You scored {results.correct_answers} out of{" "}
              {results.total_questions}
            </p>
            <button onClick={() => navigate(-1)} className="btn-primary">
              Back to Course
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="card p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{quiz?.title}</h1>
            <div className="flex items-center text-gray-600">
              <Clock className="h-5 w-5 mr-2" />
              <span>{quiz?.time_limit} mins</span>
            </div>
          </div>

          <div className="space-y-6">
            {questions.map((question, index) => (
              <div key={question.id} className="border-b pb-6">
                <h3 className="font-semibold text-gray-900 mb-3">
                  {index + 1}. {question.question_text}
                </h3>
                <div className="space-y-2">
                  {question.options?.map((option, optIndex) => (
                    <label
                      key={optIndex}
                      className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={option}
                        onChange={() => handleAnswerChange(question.id, option)}
                        checked={answers[question.id] === option}
                        className="mr-3"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-end space-x-4">
            <button onClick={() => navigate(-1)} className="btn-secondary">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary"
            >
              {submitting ? "Submitting..." : "Submit Quiz"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizPlayer;
