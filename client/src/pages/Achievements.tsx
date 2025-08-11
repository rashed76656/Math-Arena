import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trophy, Medal, Star, Lock, CheckCircle, Clock, Target, Zap, Users, BookOpen, Calculator } from "lucide-react";
import { useAuth } from "../lib/stores/useAuth";
import { useAchievements, Achievement } from "../lib/stores/useAchievements";

export default function Achievements() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { 
    achievements, 
    unreadAchievements, 
    totalUnlocked, 
    initializeAchievements, 
    markAsRead,
    getAchievementsByCategory,
    getUnlockedCount
  } = useAchievements();
  
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showOnlyUnlocked, setShowOnlyUnlocked] = useState(false);

  useEffect(() => {
    initializeAchievements();
  }, [initializeAchievements]);

  const categories = [
    { key: "all", label: "All", icon: Trophy, color: "text-yellow-300" },
    { key: "gameplay", label: "Gameplay", icon: Target, color: "text-blue-300" },
    { key: "score", label: "High Scores", icon: Star, color: "text-purple-300" },
    { key: "streak", label: "Streaks", icon: Zap, color: "text-orange-300" },
    { key: "time", label: "Time", icon: Clock, color: "text-green-300" },
    { key: "skill", label: "Skills", icon: BookOpen, color: "text-indigo-300" },
    { key: "social", label: "Social", icon: Users, color: "text-pink-300" },
  ];

  const filteredAchievements = achievements.filter(achievement => {
    const categoryMatch = selectedCategory === "all" || achievement.category === selectedCategory;
    const unlockedMatch = !showOnlyUnlocked || achievement.unlocked;
    return categoryMatch && unlockedMatch;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "bronze": return "bg-amber-600/20 border-amber-500 text-amber-300";
      case "silver": return "bg-gray-400/20 border-gray-400 text-gray-300";
      case "gold": return "bg-yellow-500/20 border-yellow-400 text-yellow-300";
      case "platinum": return "bg-cyan-400/20 border-cyan-300 text-cyan-300";
      default: return "bg-gray-600/20 border-gray-500 text-gray-300";
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case "bronze": return <Medal className="w-5 h-5 text-amber-500" />;
      case "silver": return <Medal className="w-5 h-5 text-gray-400" />;
      case "gold": return <Trophy className="w-5 h-5 text-yellow-400" />;
      case "platinum": return <Star className="w-5 h-5 text-cyan-400" />;
      default: return <Medal className="w-5 h-5 text-gray-500" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    const cat = categories.find(c => c.key === category);
    if (!cat) return <Calculator className="w-6 h-6" />;
    return <cat.icon className="w-6 h-6" />;
  };

  const handleAchievementClick = (achievement: Achievement) => {
    if (unreadAchievements.includes(achievement.id)) {
      markAsRead(achievement.id);
    }
  };

  const getProgressPercentage = (achievement: Achievement) => {
    return Math.min(100, (achievement.progress / achievement.requirement) * 100);
  };

  const formatRequirement = (requirement: number, achievementId: string) => {
    if (achievementId === "marathon_runner") {
      const hours = Math.floor(requirement / 3600000);
      return `${hours} hours`;
    }
    if (achievementId === "million_club") {
      return "1,000,000 points";
    }
    return requirement.toLocaleString();
  };

  const getTotalProgress = () => {
    const unlocked = getUnlockedCount();
    const total = achievements.length;
    return { unlocked, total, percentage: (unlocked / total) * 100 };
  };

  const progress = getTotalProgress();

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
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-300" />
            Achievements
          </h1>
          <p className="text-sm text-gray-400">
            {progress.unlocked} of {progress.total} unlocked ({Math.round(progress.percentage)}%)
          </p>
        </div>
        
        <div className="text-right">
          <div className="w-32 h-2 bg-gray-600 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-yellow-500 to-yellow-300 transition-all duration-500"
              style={{ width: `${progress.percentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Auth Warning for Guests */}
      {!isAuthenticated && (
        <div className="bg-yellow-900/30 border-b border-yellow-600/30 p-4">
          <div className="container mx-auto max-w-6xl text-center">
            <p className="text-yellow-200">
              🏆 Sign in to track achievements and earn rewards.{" "}
              <button
                onClick={() => navigate("/")}
                className="underline font-medium hover:text-yellow-100"
              >
                Sign in now
              </button>
            </p>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Filters */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 mb-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                {categories.map(({ key, label, icon: Icon, color }) => (
                  <button
                    key={key}
                    onClick={() => setSelectedCategory(key)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                      selectedCategory === key
                        ? "border-purple-400 bg-purple-900/30"
                        : "border-gray-600 bg-gray-800/50 hover:border-gray-500"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${color}`} />
                    <span className="text-white text-sm font-medium">{label}</span>
                  </button>
                ))}
              </div>
              
              <div className="flex items-center gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showOnlyUnlocked}
                    onChange={(e) => setShowOnlyUnlocked(e.target.checked)}
                    className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-300">Unlocked only</span>
                </label>
                
                <div className="text-sm text-gray-400">
                  {filteredAchievements.length} achievements
                </div>
              </div>
            </div>
          </div>

          {/* Achievements Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAchievements.map((achievement) => {
              const isUnread = unreadAchievements.includes(achievement.id);
              const progressPercentage = getProgressPercentage(achievement);
              
              return (
                <div
                  key={achievement.id}
                  onClick={() => handleAchievementClick(achievement)}
                  className={`bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border transition-all cursor-pointer relative ${
                    achievement.unlocked
                      ? "border-green-500 bg-green-900/20 hover:bg-green-900/30"
                      : "border-gray-700 hover:border-gray-600"
                  } ${isUnread ? "ring-2 ring-yellow-400/50" : ""}`}
                >
                  {/* Difficulty Badge */}
                  <div className={`absolute top-4 right-4 px-2 py-1 rounded-full text-xs font-bold border ${getDifficultyColor(achievement.difficulty)}`}>
                    {achievement.difficulty.toUpperCase()}
                  </div>

                  {/* Unread Indicator */}
                  {isUnread && (
                    <div className="absolute top-2 left-2 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                  )}

                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="text-4xl">{achievement.icon}</div>
                      <div className="flex items-center gap-2">
                        {getDifficultyIcon(achievement.difficulty)}
                        {getCategoryIcon(achievement.category)}
                      </div>
                    </div>
                    
                    {achievement.unlocked ? (
                      <CheckCircle className="w-6 h-6 text-green-400" />
                    ) : (
                      <Lock className="w-6 h-6 text-gray-500" />
                    )}
                  </div>

                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-white mb-2">{achievement.title}</h3>
                    <p className="text-sm text-gray-300 mb-3">{achievement.description}</p>
                    
                    {achievement.unlocked && achievement.unlockedAt && (
                      <p className="text-xs text-green-300">
                        Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {!achievement.unlocked && (
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-gray-400">Progress</span>
                        <span className="text-xs text-gray-400">
                          {achievement.progress.toLocaleString()} / {formatRequirement(achievement.requirement, achievement.id)}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-600 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
                          style={{ width: `${progressPercentage}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-purple-300 mt-1">
                        {Math.round(progressPercentage)}% complete
                      </div>
                    </div>
                  )}

                  {/* Reward */}
                  {achievement.reward && (
                    <div className="bg-gray-900/50 rounded-lg p-3 mt-4">
                      <div className="text-xs text-gray-400 mb-1">Reward:</div>
                      <div className="flex items-center gap-2">
                        {achievement.reward.type === "coins" && (
                          <>
                            <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
                            <span className="text-sm text-yellow-300">{achievement.reward.amount} coins</span>
                          </>
                        )}
                        {achievement.reward.type === "gems" && (
                          <>
                            <div className="w-4 h-4 bg-purple-400 rounded diamond"></div>
                            <span className="text-sm text-purple-300">{achievement.reward.amount} gems</span>
                          </>
                        )}
                        {achievement.reward.type === "title" && (
                          <>
                            <Star className="w-4 h-4 text-cyan-400" />
                            <span className="text-sm text-cyan-300">Title: "{achievement.reward.item}"</span>
                          </>
                        )}
                        {achievement.reward.type === "cosmetic" && (
                          <>
                            <Medal className="w-4 h-4 text-pink-400" />
                            <span className="text-sm text-pink-300">{achievement.reward.item}</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {filteredAchievements.length === 0 && (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">
                {showOnlyUnlocked 
                  ? "No achievements unlocked in this category yet."
                  : "No achievements found in this category."
                }
              </p>
            </div>
          )}

          {/* Achievement Tips */}
          <div className="mt-12 bg-gradient-to-r from-purple-900/20 to-blue-900/20 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4 text-center">Achievement Tips</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold text-purple-300 mb-2">Quick Unlocks:</h3>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Play your first game to unlock "First Steps"</li>
                  <li>• Answer 10 questions correctly for "Combo Starter"</li>
                  <li>• Reach wave 10 for "Wave Master"</li>
                  <li>• Try multiplayer mode for social achievements</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-bold text-blue-300 mb-2">Long-term Goals:</h3>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Play regularly to build up total score</li>
                  <li>• Practice different question types for skill achievements</li>
                  <li>• Challenge yourself with harder difficulties</li>
                  <li>• Aim for perfect accuracy in longer games</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}