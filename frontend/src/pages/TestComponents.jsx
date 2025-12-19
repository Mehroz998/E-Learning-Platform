import ReviewForm from "../components/review/ReviewForm";
import CourseProgress from "../components/progress/CourseProgress";
import AssignmentSubmit from "../components/assignment/AssignmentSubmit";

const TestComponents = () => {
  const mockAssignment = {
    id: 1,
    title: "Build a Full Stack App",
    description: "Create a complete web application using React and Node.js",
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-8">
        <div className="card p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Component Tests
          </h1>
          <p className="text-gray-600">
            Yahan pe sab new components dikh rahe hain
          </p>
        </div>

        <div className="card p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            1. Review Form
          </h2>
          <p className="text-gray-600 mb-4">
            Course review submit karne ke liye:
          </p>
          <ReviewForm courseId={1} />
        </div>

        <div className="card p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            2. Course Progress
          </h2>
          <p className="text-gray-600 mb-4">
            Student ki progress aur certificate:
          </p>
          <CourseProgress enrollmentId={1} />
        </div>

        <div className="card p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            3. Assignment Submit
          </h2>
          <p className="text-gray-600 mb-4">
            Assignment file upload karne ke liye:
          </p>
          <AssignmentSubmit
            assignment={mockAssignment}
            onSubmitSuccess={() => alert("Assignment submitted!")}
          />
        </div>

        <div className="card p-6 bg-primary-50 border-primary-200">
          <h3 className="font-semibold text-primary-900 mb-2">📝 Note:</h3>
          <ul className="text-sm text-primary-800 space-y-1">
            <li>
              • QuizPlayer separate route par hai:{" "}
              <code className="bg-white px-2 py-1 rounded">/quiz/:id</code>
            </li>
            <li>
              • Review Form course detail page ke end mein add kar sakte hain
            </li>
            <li>• Progress component dashboard mein use ho sakta hai</li>
            <li>• Assignment submit CoursePlayer mein integrate hoga</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TestComponents;
