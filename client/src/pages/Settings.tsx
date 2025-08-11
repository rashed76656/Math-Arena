import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Volume2, VolumeX, Globe, Monitor, Smartphone, Info, HelpCircle, Shield } from "lucide-react";
import { useAuth } from "../lib/stores/useAuth";
import { useAudio } from "../lib/stores/useAudio";

interface GameSettings {
  audioEnabled: boolean;
  language: "en" | "bn";
  difficulty: "easy" | "medium" | "hard";
  reducedMotion: boolean;
  autoSave: boolean;
  notifications: boolean;
}

export default function Settings() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const { isMuted, toggleMute } = useAudio();
  
  const [settings, setSettings] = useState<GameSettings>({
    audioEnabled: !isMuted,
    language: "en",
    difficulty: "easy",
    reducedMotion: false,
    autoSave: true,
    notifications: true,
  });
  
  const [activeTab, setActiveTab] = useState<"game" | "account" | "help">("game");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem("mathArenaSettings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    }
    
    // Sync audio setting
    setSettings(prev => ({ ...prev, audioEnabled: !isMuted }));
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem("mathArenaSettings", JSON.stringify(settings));
      
      // Sync audio setting
      if (settings.audioEnabled !== !isMuted) {
        toggleMute();
      }
      
      // Apply reduced motion
      if (settings.reducedMotion) {
        document.documentElement.style.setProperty("--animation-duration", "0s");
      } else {
        document.documentElement.style.removeProperty("--animation-duration");
      }
      
      // Save to server if authenticated
      if (isAuthenticated) {
        await fetch("/api/user/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(settings),
        });
      }
      
      alert("Settings saved successfully!");
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleDeleteAccount = async () => {
    if (!isAuthenticated) return;
    
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone. All your progress and data will be permanently lost."
    );
    
    if (confirmed) {
      try {
        const response = await fetch("/api/user/delete", {
          method: "DELETE",
          credentials: "include",
        });
        
        if (response.ok) {
          logout();
          navigate("/");
          alert("Your account has been deleted successfully.");
        } else {
          alert("Failed to delete account. Please try again.");
        }
      } catch (error) {
        console.error("Delete account error:", error);
        alert("Failed to delete account. Please try again.");
      }
    }
  };

  const exportData = async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await fetch("/api/user/export", {
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.blob();
        const url = window.URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = `math-arena-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert("Failed to export data. Please try again.");
      }
    } catch (error) {
      console.error("Export data error:", error);
      alert("Failed to export data. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-black/20 backdrop-blur-sm">
        <button
          onClick={() => navigate("/")}
          className="game-button-secondary px-4 py-2 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>
        
        <div className="text-center">
          <h1 className="text-xl font-bold text-white">Settings</h1>
        </div>
        
        <button
          onClick={saveSettings}
          disabled={saving}
          className="game-button px-4 py-2 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Tab Navigation */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 mb-8">
            <div className="flex">
              <button
                onClick={() => setActiveTab("game")}
                className={`flex-1 py-4 px-6 font-medium transition-colors ${
                  activeTab === "game"
                    ? "text-purple-300 border-b-2 border-purple-400 bg-purple-900/20"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Monitor className="w-5 h-5 mx-auto mb-1" />
                Game Settings
              </button>
              <button
                onClick={() => setActiveTab("account")}
                className={`flex-1 py-4 px-6 font-medium transition-colors ${
                  activeTab === "account"
                    ? "text-purple-300 border-b-2 border-purple-400 bg-purple-900/20"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Shield className="w-5 h-5 mx-auto mb-1" />
                Account & Privacy
              </button>
              <button
                onClick={() => setActiveTab("help")}
                className={`flex-1 py-4 px-6 font-medium transition-colors ${
                  activeTab === "help"
                    ? "text-purple-300 border-b-2 border-purple-400 bg-purple-900/20"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <HelpCircle className="w-5 h-5 mx-auto mb-1" />
                Help & About
              </button>
            </div>
          </div>

          {/* Game Settings Tab */}
          {activeTab === "game" && (
            <div className="space-y-6">
              {/* Audio Settings */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-purple-300" />
                  Audio Settings
                </h2>
                
                <div className="space-y-4">
                  <label className="flex items-center justify-between">
                    <div>
                      <span className="text-white font-medium">Enable Sound Effects</span>
                      <p className="text-sm text-gray-400">Play sounds for game events</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.audioEnabled}
                      onChange={(e) => updateSetting("audioEnabled", e.target.checked)}
                      className="w-5 h-5 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                    />
                  </label>
                </div>
              </div>

              {/* Display & Accessibility */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-green-300" />
                  Display & Accessibility
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Language / ভাষা
                    </label>
                    <select
                      value={settings.language}
                      onChange={(e) => updateSetting("language", e.target.value as "en" | "bn")}
                      className="game-input w-full"
                    >
                      <option value="en">English</option>
                      <option value="bn">বাংলা (Bengali)</option>
                    </select>
                  </div>
                  
                  <label className="flex items-center justify-between">
                    <div>
                      <span className="text-white font-medium">Reduced Motion</span>
                      <p className="text-sm text-gray-400">Minimize animations for better accessibility</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.reducedMotion}
                      onChange={(e) => updateSetting("reducedMotion", e.target.checked)}
                      className="w-5 h-5 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                    />
                  </label>
                </div>
              </div>

              {/* Game Preferences */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-blue-300" />
                  Game Preferences
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Default Difficulty
                    </label>
                    <select
                      value={settings.difficulty}
                      onChange={(e) => updateSetting("difficulty", e.target.value as any)}
                      className="game-input w-full"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  
                  <label className="flex items-center justify-between">
                    <div>
                      <span className="text-white font-medium">Auto-save Progress</span>
                      <p className="text-sm text-gray-400">Automatically save game progress</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.autoSave}
                      onChange={(e) => updateSetting("autoSave", e.target.checked)}
                      className="w-5 h-5 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                    />
                  </label>
                  
                  <label className="flex items-center justify-between">
                    <div>
                      <span className="text-white font-medium">Notifications</span>
                      <p className="text-sm text-gray-400">Show game notifications and updates</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.notifications}
                      onChange={(e) => updateSetting("notifications", e.target.checked)}
                      className="w-5 h-5 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Account & Privacy Tab */}
          {activeTab === "account" && (
            <div className="space-y-6">
              {isAuthenticated ? (
                <>
                  {/* Account Info */}
                  <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                    <h2 className="text-xl font-bold text-white mb-4">Account Information</h2>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-gray-700">
                        <span className="text-gray-300">Username</span>
                        <span className="text-white font-mono">{user?.username}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-700">
                        <span className="text-gray-300">Email</span>
                        <span className="text-white font-mono">{user?.email}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-gray-300">Member Since</span>
                        <span className="text-white font-mono">
                          {new Date().toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Data Management */}
                  <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                    <h2 className="text-xl font-bold text-white mb-4">Data Management</h2>
                    
                    <div className="space-y-4">
                      <button
                        onClick={exportData}
                        className="game-button-secondary w-full"
                      >
                        Export My Data
                      </button>
                      <p className="text-sm text-gray-400">
                        Download a copy of all your game data including scores, statistics, and preferences.
                      </p>
                    </div>
                  </div>

                  {/* Account Actions */}
                  <div className="bg-red-900/20 border border-red-600/30 rounded-xl p-6">
                    <h2 className="text-xl font-bold text-white mb-4">Danger Zone</h2>
                    
                    <div className="space-y-4">
                      <button
                        onClick={handleDeleteAccount}
                        className="w-full px-4 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors"
                      >
                        Delete My Account
                      </button>
                      <p className="text-sm text-red-200">
                        This action is permanent and cannot be undone. All your progress, scores, and data will be permanently deleted.
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-blue-900/30 border border-blue-600/30 rounded-xl p-6 text-center">
                  <h2 className="text-xl font-bold text-white mb-4">No Account</h2>
                  <p className="text-blue-200 mb-4">
                    You're playing as a guest. Create an account to save your progress and access more features.
                  </p>
                  <button
                    onClick={() => navigate("/")}
                    className="game-button"
                  >
                    Sign Up Now
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Help & About Tab */}
          {activeTab === "help" && (
            <div className="space-y-6">
              {/* Help & Support */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-green-300" />
                  Help & Support
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-white mb-2">How to Play</h3>
                    <p className="text-gray-300 text-sm mb-2">
                      Answer math questions correctly to destroy monsters and survive waves. Use power-ups strategically and maintain your health!
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-white mb-2">Keyboard Controls</h3>
                    <ul className="text-gray-300 text-sm space-y-1">
                      <li>• Type numbers to answer questions</li>
                      <li>• Press Enter to submit your answer</li>
                      <li>• Press Escape to pause the game</li>
                      <li>• Use 1-4 keys for power-ups (when available)</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-white mb-2">Scoring System</h3>
                    <ul className="text-gray-300 text-sm space-y-1">
                      <li>• Easy questions: 10 points</li>
                      <li>• Medium questions: 20 points</li>
                      <li>• Hard questions: 30 points</li>
                      <li>• Combo bonuses for consecutive correct answers</li>
                      <li>• Time bonuses for quick answers</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* About */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-300" />
                  About Math Survival Arena
                </h2>
                
                <div className="space-y-4 text-gray-300">
                  <p>
                    Math Survival Arena is an educational game that makes learning math fun through fast-paced gameplay. 
                    Improve your mental math skills while surviving waves of monsters!
                  </p>
                  
                  <div>
                    <h3 className="font-bold text-white mb-2">Features</h3>
                    <ul className="text-sm space-y-1">
                      <li>• Multiple difficulty levels (Easy, Medium, Hard)</li>
                      <li>• Various game modes (Classic, Timed, Endless)</li>
                      <li>• Power-up system for strategic gameplay</li>
                      <li>• Global leaderboards and achievements</li>
                      <li>• Guest play and account creation options</li>
                      <li>• Mobile and desktop support</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-white mb-2">Privacy & Data</h3>
                    <p className="text-sm">
                      We respect your privacy. Game data is stored securely and never shared without your consent. 
                      Guest players can play without providing any personal information.
                    </p>
                  </div>
                  
                  <div className="text-center pt-4 border-t border-gray-700">
                    <p className="text-sm text-gray-400">
                      Version 1.0.0 | Made with ❤️ for math learners everywhere
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
