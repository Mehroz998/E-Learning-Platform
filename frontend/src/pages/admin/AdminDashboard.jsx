import { useState, useEffect } from "react";
import { Users, UserCheck, BookOpen } from "lucide-react";
import axiosInstance from "../../api/axios";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import toast from "react-hot-toast";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axiosInstance.get("/dashboard/admin");
      setStats(response.data.data.stats);
    } catch (error) {
      toast.error("Failed to fetch admin statistics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" className="min-h-screen" />;

  const statCards = [
    {
      title: "Total Students",
      value: stats?.total_students || 0,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      title: "Total Instructors",
      value: stats?.total_instructors || 0,
      icon: UserCheck,
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
    {
      title: "Total Courses",
      value: stats?.total_courses || 0,
      icon: BookOpen,
      color: "text-emerald-600",
      bg: "bg-emerald-100",
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Overview of platform statistics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((item, index) => (
          <div key={index} className="card p-6 flex items-center space-x-4">
            <div className={`p-3 rounded-xl ${item.bg}`}>
              <item.icon className={`h-6 w-6 ${item.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                {item.title}
              </p>
              <p className="text-3xl font-bold text-gray-900">{item.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
