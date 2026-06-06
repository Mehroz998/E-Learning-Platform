import { useState, useEffect } from "react";
import { progressAPI } from "../../api/progress";
import { Download, Award } from "lucide-react";
import LoadingSpinner from "../common/LoadingSpinner";
import ProgressBar from "../course/ProgressBar";
import toast from "react-hot-toast";

const CourseProgress = ({ enrollmentId }) => {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgress();
  }, [enrollmentId]);

  const fetchProgress = async () => {
    try {
      const response = await progressAPI.getCourseProgress(enrollmentId);
      setProgress(response.data.progress);
    } catch (error) {
      console.error("Failed to load progress");
    } finally {
      setLoading(false);
    }
  };

  const downloadCertificate = async () => {
    try {
      const response = await progressAPI.getCertificate(enrollmentId);
      // Handle certificate download
      const url = response.data.certificate_url;
      window.open(url, "_blank");
      toast.success("Certificate downloaded!");
    } catch (error) {
      toast.error("Certificate not available yet");
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!progress) return null;

  const completionPercentage =
    (progress.completed_lessons / progress.total_lessons) * 100;

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Your Progress
      </h3>

      <div className="mb-4">
        <ProgressBar progress={completionPercentage} />
        <p className="text-sm text-gray-600 mt-2">
          {progress.completed_lessons} of {progress.total_lessons} lessons
          completed
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">Total Watch Time</p>
          <p className="text-lg font-semibold">
            {progress.total_watch_time || 0} mins
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Last Accessed</p>
          <p className="text-lg font-semibold">
            {progress.last_accessed
              ? new Date(progress.last_accessed).toLocaleDateString()
              : "N/A"}
          </p>
        </div>
      </div>

      {completionPercentage === 100 && (
        <button
          onClick={downloadCertificate}
          className="btn-primary w-full flex items-center justify-center space-x-2"
        >
          <Award className="h-5 w-5" />
          <span>Download Certificate</span>
        </button>
      )}
    </div>
  );
};

export default CourseProgress;
