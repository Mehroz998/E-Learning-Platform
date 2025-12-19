import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { assignmentsAPI } from "../../api/assignments";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { CheckCircle, AlertCircle, Save, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";

const AssignmentGrading = () => {
  const { id } = useParams(); // Assignment ID
  const [submissions, setSubmissions] = useState([]);
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);

  // Grading Modal
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [gradeData, setGradeData] = useState({ grade: 0, feedback: "" });
  const [gradingLoading, setGradingLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [assignRes, subRes] = await Promise.all([
        assignmentsAPI.getAssignment(id),
        assignmentsAPI.getSubmissions(id),
      ]);
      setAssignment(assignRes.data.assignment);
      setSubmissions(subRes.data.submissions || []);
    } catch (error) {
      toast.error("Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenGrade = (sub) => {
    setSelectedSubmission(sub);
    setGradeData({
      grade: sub.grade || 0,
      feedback: sub.feedback || "",
    });
  };

  const handleSubmitGrade = async (e) => {
    e.preventDefault();
    setGradingLoading(true);
    try {
      await assignmentsAPI.gradeSubmission(selectedSubmission.id, gradeData);
      toast.success("Submission graded!");
      setSelectedSubmission(null);
      fetchData(); // Refresh list
    } catch (error) {
      toast.error("Failed to save grade");
    } finally {
      setGradingLoading(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" className="min-h-screen" />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            to="/instructor/courses"
            className="text-sm text-gray-500 hover:text-primary-600 mb-2 block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            {assignment?.title}
          </h1>
          <p className="text-gray-500 mt-1">
            Max Score: {assignment?.max_score} | Due:{" "}
            {new Date(assignment?.due_date).toLocaleDateString()}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">
              Student Submissions ({submissions.length})
            </h2>
          </div>

          {submissions.length === 0 ? (
            <div className="p-12 text-center text-gray-500 italic">
              No submissions yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Content / File
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Grade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {submissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {sub.student_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {sub.student_email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(sub.submitted_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-xs truncate">
                        {sub.file_url ? (
                          <a
                            href={sub.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary-600 hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="w-4 h-4" /> View File
                          </a>
                        ) : (
                          <span title={sub.content}>
                            {sub.content?.substring(0, 30)}
                            {sub.content?.length > 30 ? "..." : ""}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {sub.graded_at ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {sub.grade} / {assignment?.max_score}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleOpenGrade(sub)}
                          className="text-primary-600 hover:text-primary-900 font-medium"
                        >
                          {sub.graded_at ? "Edit Grade" : "Grade"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Grading Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold mb-4">
              Grade Submission: {selectedSubmission.student_name}
            </h3>

            <div className="mb-4 p-3 bg-gray-50 rounded text-sm text-gray-700 max-h-40 overflow-y-auto">
              <p className="font-semibold text-xs text-gray-500 uppercase mb-1">
                Submission Content:
              </p>
              {selectedSubmission.content || "No text content."}
              {selectedSubmission.file_url && (
                <div className="mt-2">
                  <a
                    href={selectedSubmission.file_url}
                    target="_blank"
                    className="text-primary-600 underline text-xs"
                  >
                    View Attached File
                  </a>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmitGrade}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grade (Max: {assignment?.max_score})
                </label>
                <input
                  type="number"
                  className="input-field"
                  value={gradeData.grade}
                  onChange={(e) =>
                    setGradeData({ ...gradeData, grade: e.target.value })
                  }
                  max={assignment?.max_score}
                  min={0}
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Feedback
                </label>
                <textarea
                  className="input-field h-24"
                  value={gradeData.feedback}
                  onChange={(e) =>
                    setGradeData({ ...gradeData, feedback: e.target.value })
                  }
                  placeholder="Great work, but..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setSelectedSubmission(null)}
                  className="btn-secondary"
                  disabled={gradingLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex items-center gap-2"
                  disabled={gradingLoading}
                >
                  {gradingLoading ? (
                    "Saving..."
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Save Grade
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentGrading;
