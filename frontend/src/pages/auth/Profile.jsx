import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { authAPI } from "../../api/auth";
import { User, Mail, Shield, Calendar, Key, Loader } from "lucide-react";
import { formatDate } from "../../utils/helpers";
import toast from "react-hot-toast";

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwords, setPasswords] = useState({
    oldPassword: "",
    newPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authAPI.changePassword(passwords);
      toast.success("Password changed successfully!");
      setShowPasswordForm(false);
      setPasswords({ oldPassword: "", newPassword: "" });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="card p-8">
          {/* Header */}
          <div className="flex items-center space-x-6 pb-6 border-b border-gray-200">
            <div className="relative">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-primary-100"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center border-4 border-primary-100">
                  <User className="h-12 w-12 text-white" />
                </div>
              )}
              <div className="absolute bottom-0 right-0 bg-green-500 w-6 h-6 rounded-full border-4 border-white"></div>
            </div>

            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
              <p className="text-gray-600 mt-1">{user.email}</p>
              <div className="flex items-center space-x-2 mt-2">
                <span
                  className={`badge ${
                    user.role === "instructor"
                      ? "badge-primary"
                      : user.role === "admin"
                      ? "badge-danger"
                      : "badge-success"
                  }`}
                >
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Profile Information */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Profile Information
              </h2>

              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">Full Name</div>
                  <div className="font-medium text-gray-900">{user.name}</div>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">Email Address</div>
                  <div className="font-medium text-gray-900">{user.email}</div>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <Shield className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">Role</div>
                  <div className="font-medium text-gray-900 capitalize">
                    {user.role}
                  </div>
                </div>
              </div>

              {user.created_at && (
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Member Since</div>
                    <div className="font-medium text-gray-900">
                      {formatDate(user.created_at)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Change Password */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Security
                </h2>
                {!showPasswordForm && (
                  <button
                    onClick={() => setShowPasswordForm(true)}
                    className="btn-outline text-sm"
                  >
                    <Key className="h-4 w-4 inline mr-1" />
                    Change Password
                  </button>
                )}
              </div>

              {showPasswordForm ? (
                <form
                  onSubmit={handlePasswordChange}
                  className="space-y-4 p-6 bg-gray-50 rounded-lg"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={passwords.oldPassword}
                      onChange={(e) =>
                        setPasswords({
                          ...passwords,
                          oldPassword: e.target.value,
                        })
                      }
                      required
                      className="input-field"
                      placeholder="Enter current password"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text text-gray-700 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwords.newPassword}
                      onChange={(e) =>
                        setPasswords({
                          ...passwords,
                          newPassword: e.target.value,
                        })
                      }
                      required
                      minLength="6"
                      className="input-field"
                      placeholder="Enter new password"
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 btn-primary"
                    >
                      {loading ? (
                        <>
                          <Loader className="h-4 w-4 animate-spin inline mr-2" />
                          Updating...
                        </>
                      ) : (
                        "Update Password"
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordForm(false);
                        setPasswords({ oldPassword: "", newPassword: "" });
                      }}
                      className="flex-1 btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-6 bg-gray-50 rounded-lg text-center text-gray-500">
                  <Key className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>Your password is secure</p>
                  <p className="text-sm">Last changed: Never</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
