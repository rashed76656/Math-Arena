import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, Filter, Search, ArrowLeft, Medal, User, Clock, Target } from "lucide-react";
import { useAuth } from "../lib/stores/useAuth";
import { formatScore, formatTime, calculateAccuracy } from "../lib/gameUtils";

interface LeaderboardEntry {
  id: string;
  username: string;
  score: number;
  wave: number;
  accuracy: number;
  difficulty: "easy" | "medium" | "hard";
  mode: string;
  timeElapsed: number;
  timestamp: string;
  rank: number;
}

type TimeFilter = "all" | "today" | "week" | "month";
type DifficultyFilter = "all" | "easy" | "medium" | "hard";
type ModeFilter = "all" | "classic" | "timed" | "endless";

export default function Leaderboard() {
  const navigate = useNavigate();
  const { isAuthenticated, user, guestSession } = useAuth();
  
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("all");
  const [modeFilter, setModeFilter] = useState<ModeFilter>("all");
  const [showLocalScores, setShowLocalScores] = useState(!isAuthenticated);
  const [localScores, setLocalScores] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    fetchLeaderboard();
    loadLocalScores();
  }, [timeFilter, difficultyFilter, modeFilter]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        timeframe: timeFilter,
        difficulty: difficultyFilter,
        mode: modeFilter,
        limit: "50",
      });

      const response = await fetch(`/api/leaderboard?${params}`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setLeaderboardData(data.entries || []);
      } else {
        // Use mock data as fallback
        setLeaderboardData(generateMockLeaderboard());
      }
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
      setLeaderboardData(generateMockLeaderboard());
    } finally {
      setLoading(false);
    }
  };

  const loadLocalScores = () => {
    if (guestSession?.localScores) {
      const scores: LeaderboardEntry[] = guestSession.localScores.map((score, index) => ({
        id: `local_${index}`,
        username: "You (Guest)",
        score: score.score,
        wave: score.wave,
        accuracy: score.accuracy,
        difficulty: "easy", // Default since we don't store difficulty in local scores
        mode: "classic",
        timeElapsed: 0,
        timestamp: score.timestamp,
        rank: index + 1,
      })).sort((a, b) => b.score - a.score);
      
      setLocalScores(scores);
    }
  };

  const generateMockLeaderboard = (): LeaderboardEntry[] => {
    // Generate some realistic mock data for development
    const mockData: LeaderboardEntry[] = [];
    const usernames = ["MathWizard", "CalculatorPro", "NumberNinja", "AlgebraAce", "GeometryGuru", 
                      "QuickCalc", "BrainTrain", "MathMaster", "DigitDestroyer", "FormulaFighter"];
    const modes = ["classic", "timed", "endless"];
    const difficulties = ["easy", "medium", "hard"];
    
    for (let i = 0; i < 20; i++) {
      const score = Math.floor(Math.random() * 15000) + 1000;
      const wave = Math.floor(score / 500) + Math.floor(Math.random() * 5);
      const accuracy = Math.floor(Math.random() * 40) + 60; // 60-100%
      
      mockData.push({
        id: `mock_${i}`,
        username: usernames[Math.floor(Math.random() * usernames.length)] + (i > 9 ? Math.floor(Math.random() * 100) : ''),
        score,
        wave,
        accuracy,
        difficulty: difficulties[Math.floor(Math.random() * difficulties.length)] as any,
        mode: modes[Math.floor(Math.random() * modes.length)],
        timeElapsed: Math.floor(Math.random() * 600000) + 60000, // 1-10 minutes
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        rank: i + 1,
      });
    }
    
    return mockData.sort((a, b) => b.score - a.score).map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));
  };

  const filteredData = leaderboardData.filter(entry => {
    if (searchTerm && !entry.username.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  const currentUserRank = leaderboardData.findIndex(entry => 
    isAuthenticated && user && entry.username === user.username
  ) + 1;

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="w-5 h-5 text-yellow-400" />;
      case 2: return <Medal className="w-5 h-5 text-gray-400" />;
      case 3: return <Medal className="w-5 h-5 text-amber-600" />;
      default: return <span className="text-gray-400 font-bold text-sm">#{rank}</span>;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "text-green-300";
      case "medium": return "text-yellow-300";
      case "hard": return "text-red-300";
      default: return "text-gray-300";
    }
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case "classic": return "🎯";
      case "timed": return "⏱️";
      case "endless": return "♾️";
      default: return "🎮";
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
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-400" />
            Leaderboard
          </h1>
        </div>
        
        <div className="w-20"></div> {/* Spacer for centering */}
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Filters and Search */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 mb-8">
            <div className="grid md:grid-cols-5 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Search Player
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Enter username..."
                    className="game-input pl-10 w-full"
                  />
                </div>
              </div>

              {/* Time Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Time Period
                </label>
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
                  className="game-input w-full"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>

              {/* Difficulty Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Difficulty
                </label>
                <select
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value as DifficultyFilter)}
                  className="game-input w-full"
                >
                  <option value="all">All Levels</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              {/* Mode Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Game Mode
                </label>
                <select
                  value={modeFilter}
                  onChange={(e) => setModeFilter(e.target.value as ModeFilter)}
                  className="game-input w-full"
                >
                  <option value="all">All Modes</option>
                  <option value="classic">Classic</option>
                  <option value="timed">Timed</option>
                  <option value="endless">Endless</option>
                </select>
              </div>
            </div>

            {/* Local vs Global Toggle */}
            {!isAuthenticated && localScores.length > 0 && (
              <div className="mt-4 flex items-center gap-4">
                <button
                  onClick={() => setShowLocalScores(!showLocalScores)}
                  className={`px-4 py-2 rounded-lg border transition-all ${
                    showLocalScores
                      ? "border-blue-400 bg-blue-900/30 text-blue-200"
                      : "border-gray-600 bg-gray-800/50 text-gray-300"
                  }`}
                >
                  {showLocalScores ? "Viewing Local Scores" : "View My Local Scores"}
                </button>
                {showLocalScores && (
                  <span className="text-sm text-blue-300">
                    Your guest scores ({localScores.length} games)
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Current User Rank (if authenticated) */}
          {isAuthenticated && currentUserRank > 0 && (
            <div className="bg-purple-900/30 border border-purple-600/30 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-purple-300" />
                  <span className="text-white font-medium">Your Rank</span>
                </div>
                <div className="flex items-center gap-2">
                  {getRankIcon(currentUserRank)}
                  <span className="text-white font-bold">#{currentUserRank}</span>
                </div>
              </div>
            </div>
          )}

          {/* Leaderboard Table */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-gray-300">Loading leaderboard...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-900/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Rank
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Player
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Score
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Wave
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Accuracy
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Mode
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {(showLocalScores ? localScores : filteredData).map((entry, index) => (
                      <tr 
                        key={entry.id}
                        className={`hover:bg-gray-700/30 transition-colors ${
                          isAuthenticated && user && entry.username === user.username
                            ? "bg-purple-900/20"
                            : ""
                        }`}
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center">
                            {getRankIcon(entry.rank)}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${
                              entry.username.includes("You") ? "text-blue-300" : "text-white"
                            }`}>
                              {entry.username}
                            </span>
                            {isAuthenticated && user && entry.username === user.username && (
                              <span className="text-xs text-purple-300">(You)</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="font-mono text-purple-300 font-bold">
                            {formatScore(entry.score)}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="font-mono text-green-300">
                            {entry.wave}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-blue-400" />
                            <span className="font-mono text-blue-300">
                              {entry.accuracy}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getModeIcon(entry.mode)}</span>
                            <span className={`text-sm font-medium ${getDifficultyColor(entry.difficulty)}`}>
                              {entry.difficulty.toUpperCase()}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Clock className="w-4 h-4" />
                            {new Date(entry.timestamp).toLocaleDateString()}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredData.length === 0 && !loading && (
                  <div className="p-8 text-center text-gray-400">
                    {searchTerm ? "No players found matching your search." : "No scores available for the selected filters."}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Call to Action for Guests */}
          {!isAuthenticated && (
            <div className="mt-8 bg-blue-900/30 border border-blue-600/30 rounded-xl p-6 text-center">
              <h3 className="text-lg font-bold text-white mb-2">Join the Competition!</h3>
              <p className="text-blue-200 mb-4">
                Create an account to save your scores and compete on the global leaderboard.
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
      </div>
    </div>
  );
}
