import { useState } from "react";
import { assignmentsAPI } from "../../api/assignments";
import { Upload, FileText, Loader } from "lucide-react";
import toast from "react-hot-toast";

const AssignmentSubmit = ({ assignment, onSubmitSuccess }) => {
  const [file, setFile] = useState(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error("Please select a file to submit");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("notes", notes);

      await assignmentsAPI.submitAssignment(assignment.id, formData);
      toast.success("Assignment submitted successfully!");
      onSubmitSuccess?.();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to submit assignment"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">
        Submit Assignment
      </h3>

      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-2">{assignment.title}</h4>
        <p className="text-gray-600 text-sm">{assignment.description}</p>
        <p className="text-sm text-gray-500 mt-2">
          Due: {new Date(assignment.due_date).toLocaleDateString()}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload File
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            {file ? (
              <div className="flex items-center justify-center space-x-2 text-green-600">
                <FileText className="h-5 w-5" />
                <span>{file.name}</span>
              </div>
            ) : (
              <label className="cursor-pointer">
                <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <span className="text-sm text-gray-600">
                  Click to upload or drag and drop
                </span>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.zip"
                />
              </label>
            )}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows="3"
            className="input-field"
            placeholder="Add any notes for your instructor..."
          />
        </div>

        {/* Submit Button */}
        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary flex-1"
          >
            {submitting ? (
              <>
                <Loader className="h-5 w-5 animate-spin inline mr-2" />
                Submitting...
              </>
            ) : (
              "Submit Assignment"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AssignmentSubmit;
