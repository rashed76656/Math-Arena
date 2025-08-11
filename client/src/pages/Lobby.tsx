import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Settings, Users, Zap, Target, Clock, ArrowLeft, User } from "lucide-react";
import { useAuth } from "../lib/stores/useAuth";
import { useGameState } from "../lib/stores/useGameState";
import AuthModal from "../components/auth/AuthModal";
import GuestContinueCard from "../components/auth/GuestContinueCard";

type GameMode = "classic" | "timed" | "endless";
type Difficulty = "easy" | "medium" | "hard";

interface GameSettings {
  mode: GameMode;
  difficulty: Difficulty;
  timeLimit: number;
  startingHealth: number;
  powerUpsEnabled: boolean;
}

export default function Lobby() {
  const navigate = useNavigate();
  const { isAuthenticated, isGuest, user, startGuestSession } = useAuth();
  const { setDifficulty, resetGame } = useGameState();
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showGuestCard, setShowGuestCard] = useState(false);
  const [gameSettings, setGameSettings] = useState<GameSettings>({
    mode: "classic",
    difficulty: "easy",
    timeLimit: 30,
    startingHealth: 5,
    powerUpsEnabled: true,
  });

  // Redirect to auth if not logged in and not guest
  useEffect(() => {
    if (!isAuthenticated && !isGuest) {
      setShowGuestCard(true);
    }
  }, [isAuthenticated, isGuest]);

  const handleStartGame = () => {
    console.log("Starting game with settings:", gameSettings);
    
    // Apply settings to game state
    setDifficulty(gameSettings.difficulty);
    resetGame();
    
    // Navigate to game
    navigate("/game", { state: { gameSettings } });
  };

  const handleSignUpFromCard = () => {
    setShowGuestCard(false);
    setShowAuthModal(true);
  };

  const handleContinueAsGuest = async () => {
    setShowGuestCard(false);
    await startGuestSession();
  };

  const updateSetting = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    setGameSettings(prev => ({ ...prev, [key]: value }));
  };

  if (showGuestCard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="mx-4">
          <GuestContinueCard
            onSignUp={handleSignUpFromCard}
            onContinueAsGuest={handleContinueAsGuest}
          />
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
          <h1 className="text-xl font-bold text-white">Game Lobby</h1>
          <div className="text-sm text-gray-300">
            {isAuthenticated ? `Welcome, ${user?.username}!` : "Playing as Guest"}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {!isAuthenticated && (
            <button
              onClick={() => setShowAuthModal(true)}
              className="game-button px-4 py-2 text-sm"
            >
              Sign Up
            </button>
          )}
          <button
            onClick={() => navigate("/settings")}
            className="game-button-secondary px-4 py-2"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Game Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Game Mode Selection */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-300" />
                Game Mode
              </h2>
              
              <div className="grid md:grid-cols-3 gap-4">
                <button
                  onClick={() => updateSetting("mode", "classic")}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    gameSettings.mode === "classic"
                      ? "border-purple-400 bg-purple-900/30"
                      : "border-gray-600 bg-gray-800/50"
                  }`}
                >
                  <div className="text-center">
                    <Play className="w-8 h-8 mx-auto mb-2 text-purple-300" />
                    <h3 className="font-bold text-white mb-1">Classic</h3>
                    <p className="text-sm text-gray-300">Survive as many waves as possible</p>
                  </div>
                </button>

                <button
                  onClick={() => updateSetting("mode", "timed")}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    gameSettings.mode === "timed"
                      ? "border-purple-400 bg-purple-900/30"
                      : "border-gray-600 bg-gray-800/50"
                  }`}
                >
                  <div className="text-center">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-blue-300" />
                    <h3 className="font-bold text-white mb-1">Timed Challenge</h3>
                    <p className="text-sm text-gray-300">Score as much as possible in 5 minutes</p>
                  </div>
                </button>

                <button
                  onClick={() => updateSetting("mode", "endless")}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    gameSettings.mode === "endless"
                      ? "border-purple-400 bg-purple-900/30"
                      : "border-gray-600 bg-gray-800/50"
                  }`}
                >
                  <div className="text-center">
                    <Zap className="w-8 h-8 mx-auto mb-2 text-yellow-300" />
                    <h3 className="font-bold text-white mb-1">Endless</h3>
                    <p className="text-sm text-gray-300">No time limit, pure survival</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Difficulty Selection */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-green-300" />
                Difficulty Level
              </h2>
              
              <div className="grid md:grid-cols-3 gap-4">
                <button
                  onClick={() => updateSetting("difficulty", "easy")}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    gameSettings.difficulty === "easy"
                      ? "border-green-400 bg-green-900/30"
                      : "border-gray-600 bg-gray-800/50"
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">😊</div>
                    <h3 className="font-bold text-white mb-1">Easy</h3>
                    <p className="text-sm text-gray-300">Simple addition & subtraction</p>
                    <p className="text-xs text-green-300 mt-1">30s per question</p>
                  </div>
                </button>

                <button
                  onClick={() => updateSetting("difficulty", "medium")}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    gameSettings.difficulty === "medium"
                      ? "border-yellow-400 bg-yellow-900/30"
                      : "border-gray-600 bg-gray-800/50"
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">🤔</div>
                    <h3 className="font-bold text-white mb-1">Medium</h3>
                    <p className="text-sm text-gray-300">Includes multiplication</p>
                    <p className="text-xs text-yellow-300 mt-1">20s per question</p>
                  </div>
                </button>

                <button
                  onClick={() => updateSetting("difficulty", "hard")}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    gameSettings.difficulty === "hard"
                      ? "border-red-400 bg-red-900/30"
                      : "border-gray-600 bg-gray-800/50"
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">😤</div>
                    <h3 className="font-bold text-white mb-1">Hard</h3>
                    <p className="text-sm text-gray-300">All operations + mixed</p>
                    <p className="text-xs text-red-300 mt-1">15s per question</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-300" />
                Game Settings
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Starting Health: {gameSettings.startingHealth}
                  </label>
                  <input
                    type="range"
                    min="3"
                    max="10"
                    value={gameSettings.startingHealth}
                    onChange={(e) => updateSetting("startingHealth", parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>3 (Hard)</span>
                    <span>10 (Easy)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Question Time Limit: {gameSettings.timeLimit}s
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="60"
                    step="5"
                    value={gameSettings.timeLimit}
                    onChange={(e) => updateSetting("timeLimit", parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>10s (Fast)</span>
                    <span>60s (Relaxed)</span>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={gameSettings.powerUpsEnabled}
                    onChange={(e) => updateSetting("powerUpsEnabled", e.target.checked)}
                    className="w-5 h-5 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                  />
                  <div>
                    <span className="text-white font-medium">Enable Power-ups</span>
                    <p className="text-sm text-gray-400">Freeze, Heal, Shield, and Score Multiplier abilities</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Start Game Button */}
            <button
              onClick={handleStartGame}
              className="game-button w-full text-xl py-4 flex items-center justify-center gap-3"
            >
              <Play className="w-6 h-6" />
              Start Game
            </button>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            {/* Player Info */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <User className="w-5 h-5 text-purple-300" />
                <h3 className="text-lg font-bold text-white">Player Info</h3>
              </div>
              
              {isAuthenticated ? (
                <div className="space-y-2">
                  <div className="text-gray-300">
                    <span className="text-white font-medium">{user?.username}</span>
                  </div>
                  <div className="text-sm text-gray-400">
                    Total Games: {user?.stats?.totalGames || 0}
                  </div>
                  <div className="text-sm text-gray-400">
                    Best Score: {user?.stats?.totalScore || 0}
                  </div>
                  <div className="text-sm text-gray-400">
                    Accuracy: {user?.stats?.averageAccuracy || 0}%
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-yellow-200 font-medium">Guest Player</div>
                  <div className="text-sm text-gray-400">
                    Progress saves locally only
                  </div>
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="game-button w-full mt-3 text-sm py-2"
                  >
                    Create Account to Save Progress
                  </button>
                </div>
              )}
            </div>

            {/* Game Tips */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-bold text-white mb-4">Quick Tips</h3>
              
              <div className="space-y-3 text-sm text-gray-300">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
                  <div>Answer correctly to destroy monsters and build combos</div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0" />
                  <div>Use power-ups strategically when surrounded</div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                  <div>Watch your health - monsters deal damage if they reach you</div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0" />
                  <div>Higher difficulty = more points but faster gameplay</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
              <button
                onClick={() => navigate("/tutorial")}
                className="game-button-secondary w-full py-3 flex items-center justify-center gap-2"
              >
                <Users className="w-4 h-4" />
                Tutorial
              </button>
              
              <button
                onClick={() => navigate("/leaderboard")}
                className="game-button-secondary w-full py-3 flex items-center justify-center gap-2"
              >
                <Target className="w-4 h-4" />
                Leaderboard
              </button>
              
              <button
                onClick={() => navigate("/shop")}
                className="game-button-secondary w-full py-3 flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                Shop
              </button>
            </div>
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}
