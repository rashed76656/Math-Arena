import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Trophy, Target, Clock, TrendingUp, ArrowLeft, Edit2, Save, X } from "lucide-react";
import { useAuth } from "../lib/stores/useAuth";
import { formatScore, formatTime, calculateAccuracy } from "../lib/gameUtils";

interface UserStats {
  totalGames: number;
  totalScore: number;
  bestScore: number;
  bestWave: number;
  averageAccuracy: number;
  totalPlayTime: number;
  favoriteMode: string;
  favoriteDifficulty: string;
  winStreak: number;
  currentStreak: number;
}

interface RecentGame {
  id: string;
  score: number;
  wave: number;
  accuracy: number;
  difficulty: string;
  mode: string;
  timeElapsed: number;
  timestamp: string;
}

export default function Profile() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedUsername, setEditedUsername] = useState(user?.username || "");
  const [userStats, setUserStats] = useState<UserStats>({
    totalGames: 0,
    totalScore: 0,
    bestScore: 0,
    bestWave: 0,
    averageAccuracy: 0,
    totalPlayTime: 0,
    favoriteMode: "classic",
    favoriteDifficulty: "easy",
    winStreak: 0,
    currentStreak: 0,
  });
  const [recentGames, setRecentGames] = useState<RecentGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
      return;
    }
    
    fetchUserProfile();
  }, [isAuthenticated, navigate]);

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      // Fetch user stats
      const statsResponse = await fetch("/api/user/stats", {
        credentials: "include",
      });
      
      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        setUserStats(stats);
      } else {
        // Use mock data for development
        setUserStats({
          totalGames: 47,
          totalScore: 89420,
          bestScore: 12850,
          bestWave: 15,
          averageAccuracy: 87,
          totalPlayTime: 145800000, // ~40 hours
          favoriteMode: "classic",
          favoriteDifficulty: "medium",
          winStreak: 8,
          currentStreak: 3,
        });
      }

      // Fetch recent games
      const gamesResponse = await fetch("/api/user/games?limit=10", {
        credentials: "include",
      });
      
      if (gamesResponse.ok) {
        const games = await gamesResponse.json();
        setRecentGames(games.games || []);
      } else {
        // Use mock data for development
        setRecentGames(generateMockRecentGames());
      }
    } catch (error) {
      console.error("Failed to fetch profile data:", error);
      // Use mock data as fallback
      setUserStats({
        totalGames: 47,
        totalScore: 89420,
        bestScore: 12850,
        bestWave: 15,
        averageAccuracy: 87,
        totalPlayTime: 145800000,
        favoriteMode: "classic",
        favoriteDifficulty: "medium",
        winStreak: 8,
        currentStreak: 3,
      });
      setRecentGames(generateMockRecentGames());
    } finally {
      setLoading(false);
    }
  };

  const generateMockRecentGames = (): RecentGame[] => {
    const modes = ["classic", "timed", "endless"];
    const difficulties = ["easy", "medium", "hard"];
    const games: RecentGame[] = [];
    
    for (let i = 0; i < 10; i++) {
      games.push({
        id: `game_${i}`,
        score: Math.floor(Math.random() * 10000) + 1000,
        wave: Math.floor(Math.random() * 12) + 3,
        accuracy: Math.floor(Math.random() * 40) + 60,
        difficulty: difficulties[Math.floor(Math.random() * difficulties.length)],
        mode: modes[Math.floor(Math.random() * modes.length)],
        timeElapsed: Math.floor(Math.random() * 600000) + 60000,
        timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      });
    }
    
    return games;
  };

  const handleSaveProfile = async () => {
    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username: editedUsername,
        }),
      });

      if (response.ok) {
        setIsEditing(false);
        // Refresh profile data
        fetchUserProfile();
      } else {
        alert("Failed to update profile. Username might be taken.");
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      alert("Failed to update profile. Please try again.");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "text-green-300 bg-green-900/20";
      case "medium": return "text-yellow-300 bg-yellow-900/20";
      case "hard": return "text-red-300 bg-red-900/20";
      default: return "text-gray-300 bg-gray-900/20";
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="mb-4">Please sign in to view your profile.</p>
          <button onClick={() => navigate("/")} className="game-button">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

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
            <User className="w-6 h-6 text-purple-300" />
            Player Profile
          </h1>
        </div>
        
        <button
          onClick={handleLogout}
          className="game-button-secondary px-4 py-2"
        >
          Logout
        </button>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-gray-300">Loading your profile...</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Profile Header */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editedUsername}
                            onChange={(e) => setEditedUsername(e.target.value)}
                            className="game-input text-xl font-bold"
                            maxLength={20}
                          />
                          <button
                            onClick={handleSaveProfile}
                            className="text-green-400 hover:text-green-300"
                          >
                            <Save className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => {
                              setIsEditing(false);
                              setEditedUsername(user?.username || "");
                            }}
                            className="text-red-400 hover:text-red-300"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h2 className="text-2xl font-bold text-white">{user?.username}</h2>
                          <button
                            onClick={() => setIsEditing(true)}
                            className="text-gray-400 hover:text-white"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      <p className="text-gray-400">Member since {new Date().toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-3xl font-bold text-purple-300">
                      {formatScore(userStats.totalScore)}
                    </div>
                    <div className="text-gray-400">Total Score</div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-300">{userStats.totalGames}</div>
                    <div className="text-sm text-gray-400">Games Played</div>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-300">{formatScore(userStats.bestScore)}</div>
                    <div className="text-sm text-gray-400">Best Score</div>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-300">{userStats.bestWave}</div>
                    <div className="text-sm text-gray-400">Best Wave</div>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-300">{userStats.averageAccuracy}%</div>
                    <div className="text-sm text-gray-400">Average Accuracy</div>
                  </div>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                {/* Detailed Statistics */}
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-300" />
                    Statistics
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-gray-700">
                      <span className="text-gray-300">Total Play Time</span>
                      <span className="text-white font-mono">{formatTime(userStats.totalPlayTime)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-700">
                      <span className="text-gray-300">Average Score</span>
                      <span className="text-white font-mono">
                        {formatScore(Math.floor(userStats.totalScore / Math.max(userStats.totalGames, 1)))}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-700">
                      <span className="text-gray-300">Favorite Mode</span>
                      <span className="text-purple-300 font-medium capitalize">{userStats.favoriteMode}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-700">
                      <span className="text-gray-300">Favorite Difficulty</span>
                      <span className={`font-medium capitalize ${getDifficultyColor(userStats.favoriteDifficulty).split(' ')[0]}`}>
                        {userStats.favoriteDifficulty}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-700">
                      <span className="text-gray-300">Win Streak (Best)</span>
                      <span className="text-yellow-300 font-mono">{userStats.winStreak}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-300">Current Streak</span>
                      <span className="text-green-300 font-mono">{userStats.currentStreak}</span>
                    </div>
                  </div>
                </div>

                {/* Recent Games */}
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-300" />
                    Recent Games
                  </h3>
                  
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {recentGames.map((game) => (
                      <div key={game.id} className="bg-gray-900/50 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-purple-300 font-bold">
                              {formatScore(game.score)}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded ${getDifficultyColor(game.difficulty)}`}>
                              {game.difficulty.toUpperCase()}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400">
                            {new Date(game.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Trophy className="w-3 h-3 text-yellow-400" />
                            <span className="text-gray-300">Wave {game.wave}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Target className="w-3 h-3 text-green-400" />
                            <span className="text-gray-300">{game.accuracy}%</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-blue-400" />
                            <span className="text-gray-300">{formatTime(game.timeElapsed)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => navigate("/leaderboard")}
                    className="w-full mt-4 game-button-secondary py-2 text-sm"
                  >
                    View All Games
                  </button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid md:grid-cols-3 gap-4">
                <button
                  onClick={() => navigate("/lobby")}
                  className="game-button p-6 flex flex-col items-center gap-3"
                >
                  <Trophy className="w-8 h-8" />
                  <div>
                    <div className="font-bold">Play Now</div>
                    <div className="text-sm opacity-80">Start a new game</div>
                  </div>
                </button>
                
                <button
                  onClick={() => navigate("/leaderboard")}
                  className="game-button-secondary p-6 flex flex-col items-center gap-3"
                >
                  <TrendingUp className="w-8 h-8" />
                  <div>
                    <div className="font-bold">Leaderboard</div>
                    <div className="text-sm opacity-80">See your ranking</div>
                  </div>
                </button>
                
                <button
                  onClick={() => navigate("/shop")}
                  className="game-button-secondary p-6 flex flex-col items-center gap-3"
                >
                  <Target className="w-8 h-8" />
                  <div>
                    <div className="font-bold">Shop</div>
                    <div className="text-sm opacity-80">Customize your game</div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
