import { useState } from "react";
import { X, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../lib/stores/useAuth";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "login" | "signup";
}

export default function AuthModal({ isOpen, onClose, defaultTab = "login" }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<"login" | "signup">(defaultTab);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
    confirmPassword: "",
  });

  const { login, signup } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (activeTab === "login") {
        const success = await login(formData.email, formData.password);
        if (success) {
          onClose();
        } else {
          setError("Invalid email or password");
        }
      } else {
        if (formData.password !== formData.confirmPassword) {
          setError("Passwords do not match");
          return;
        }
        
        if (formData.password.length < 6) {
          setError("Password must be at least 6 characters");
          return;
        }

        const success = await signup(formData.email, formData.password, formData.username);
        if (success) {
          onClose();
        } else {
          setError("Failed to create account. Email might already be in use.");
        }
      }
    } catch (error) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setError(""); // Clear error when user starts typing
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-md mx-4 border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">
            {activeTab === "login" ? "Sign In" : "Create Account"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab("login")}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === "login"
                ? "text-purple-300 border-b-2 border-purple-400 bg-purple-900/20"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setActiveTab("signup")}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === "signup"
                ? "text-purple-300 border-b-2 border-purple-400 bg-purple-900/20"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="bg-red-900/50 border border-red-600 rounded-lg p-3 text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Username field (signup only) */}
          {activeTab === "signup" && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  className="game-input pl-10 w-full"
                  placeholder="Enter your username"
                  minLength={3}
                  maxLength={20}
                />
              </div>
            </div>
          )}

          {/* Email field */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="game-input pl-10 w-full"
                placeholder="Enter your email"
              />
            </div>
          </div>

          {/* Password field */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="game-input pl-10 pr-10 w-full"
                placeholder="Enter your password"
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-white"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password field (signup only) */}
          {activeTab === "signup" && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  className="game-input pl-10 w-full"
                  placeholder="Confirm your password"
                  minLength={6}
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="game-button w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {activeTab === "login" ? "Signing in..." : "Creating account..."}
              </div>
            ) : (
              activeTab === "login" ? "Sign In" : "Create Account"
            )}
          </button>

          {/* Additional Info */}
          <div className="text-xs text-gray-400 text-center">
            {activeTab === "login" ? (
              <>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => setActiveTab("signup")}
                  className="text-purple-300 hover:text-purple-200 underline"
                >
                  Sign up here
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setActiveTab("login")}
                  className="text-purple-300 hover:text-purple-200 underline"
                >
                  Sign in here
                </button>
              </>
            )}
          </div>
        </form>

        {/* Guest Play Reminder */}
        <div className="px-6 pb-6">
          <div className="bg-blue-900/30 border border-blue-600/30 rounded-lg p-3 text-center">
            <p className="text-sm text-blue-200">
              Don't want to sign up? You can always{" "}
              <button
                onClick={onClose}
                className="text-blue-300 hover:text-blue-100 underline font-medium"
              >
                continue as guest
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
