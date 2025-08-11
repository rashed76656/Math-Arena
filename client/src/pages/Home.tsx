import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Play, BookOpen, Trophy, Settings, Gamepad2, Users, Zap } from "lucide-react";
import { useAuth } from "../lib/stores/useAuth";
import { formatScore } from "../lib/gameUtils";
import AuthModal from "../components/auth/AuthModal";
import GuestContinueCard from "../components/auth/GuestContinueCard";

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, isGuest, user, guestSession, startGuestSession } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showGuestCard, setShowGuestCard] = useState(false);
  const [topScores, setTopScores] = useState([
    { rank: 1, username: "MathMaster", score: 15420 },
    { rank: 2, username: "QuickCalc", score: 12890 },
    { rank: 3, username: "NumberNinja", score: 11250 },
    { rank: 4, username: "AlgebraAce", score: 9870 },
    { rank: 5, username: "GeometryGuru", score: 8965 },
  ]);

  const handlePlayClick = () => {
    if (isAuthenticated) {
      navigate("/lobby");
    } else if (isGuest) {
      navigate("/lobby");
    } else {
      setShowGuestCard(true);
    }
  };

  const handleSignUpFromCard = () => {
    setShowGuestCard(false);
    setShowAuthModal(true);
  };

  const handleContinueAsGuest = async () => {
    setShowGuestCard(false);
    await startGuestSession();
    navigate("/lobby");
  };

  const handleQuickStart = () => {
    if (isAuthenticated || isGuest) {
      navigate("/game");
    } else {
      setShowGuestCard(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-3">
            <Gamepad2 className="w-8 h-8 text-purple-300" />
            <h1 className="text-2xl font-bold text-white">Math Survival Arena</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className="text-gray-300">Welcome, {user?.username}!</span>
                <button
                  onClick={() => navigate("/profile")}
                  className="game-button-secondary px-4 py-2"
                >
                  Profile
                </button>
              </div>
            ) : isGuest ? (
              <div className="flex items-center gap-3">
                <span className="text-gray-300">Playing as Guest</span>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="game-button px-4 py-2 text-sm"
                >
                  Sign Up
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="game-button px-6 py-2"
              >
                Sign In
              </button>
            )}
          </div>
        </header>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hero Section */}
            <div className="text-center bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700">
              <div className="mb-6">
                <h2 className="text-4xl md:text-6xl font-bold text-white mb-4">
                  Math <span className="text-purple-300">Survival</span> Arena
                </h2>
                <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                  Answer math questions to destroy approaching monsters and survive endless waves in this fast-paced educational game!
                </p>
              </div>

              {/* Quick Demo Stats */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-300">∞</div>
                  <div className="text-sm text-gray-400">Endless Waves</div>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-300">200+</div>
                  <div className="text-sm text-gray-400">Math Questions</div>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-300">3</div>
                  <div className="text-sm text-gray-400">Difficulty Levels</div>
                </div>
              </div>

              {/* Main CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handlePlayClick}
                  className="game-button text-lg px-8 py-4 flex items-center justify-center gap-2"
                >
                  <Play className="w-6 h-6" />
                  Play Now
                </button>
                <button
                  onClick={() => navigate("/tutorial")}
                  className="game-button-secondary text-lg px-8 py-4 flex items-center justify-center gap-2"
                >
                  <BookOpen className="w-6 h-6" />
                  Tutorial
                </button>
              </div>

              {/* Guest Play Notice */}
              {!isAuthenticated && !isGuest && (
                <div className="mt-4 text-sm text-blue-200">
                  Play instantly as guest — no signup required! 
                  <br />
                  Create an account anytime to save your progress.
                </div>
              )}
            </div>

            {/* Game Features */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                  <Zap className="w-6 h-6 text-yellow-400" />
                  <h3 className="text-xl font-bold text-white">Fast-Paced Action</h3>
                </div>
                <ul className="text-gray-300 space-y-2">
                  <li>• Real-time monster waves</li>
                  <li>• Power-ups and special abilities</li>
                  <li>• Combo system for bonus points</li>
                  <li>• Multiple monster types and bosses</li>
                </ul>
              </div>

              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                  <BookOpen className="w-6 h-6 text-green-400" />
                  <h3 className="text-xl font-bold text-white">Educational Content</h3>
                </div>
                <ul className="text-gray-300 space-y-2">
                  <li>• Addition, subtraction, multiplication</li>
                  <li>• Division and mixed operations</li>
                  <li>• Adaptive difficulty scaling</li>
                  <li>• Progress tracking and analytics</li>
                </ul>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={handleQuickStart}
                className="bg-red-600 hover:bg-red-500 text-white rounded-lg p-4 transition-all duration-200 transform hover:scale-105"
              >
                <Play className="w-6 h-6 mx-auto mb-2" />
                <div className="text-sm font-bold">Quick Start</div>
              </button>
              
              <button
                onClick={() => navigate("/leaderboard")}
                className="bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg p-4 transition-all duration-200 transform hover:scale-105"
              >
                <Trophy className="w-6 h-6 mx-auto mb-2" />
                <div className="text-sm font-bold">Leaderboard</div>
              </button>
              
              <button
                onClick={() => navigate("/shop")}
                className="bg-purple-600 hover:bg-purple-500 text-white rounded-lg p-4 transition-all duration-200 transform hover:scale-105"
              >
                <Users className="w-6 h-6 mx-auto mb-2" />
                <div className="text-sm font-bold">Shop</div>
              </button>
              
              <button
                onClick={() => navigate("/settings")}
                className="bg-gray-600 hover:bg-gray-500 text-white rounded-lg p-4 transition-all duration-200 transform hover:scale-105"
              >
                <Settings className="w-6 h-6 mx-auto mb-2" />
                <div className="text-sm font-bold">Settings</div>
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Top Scores */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <h3 className="text-lg font-bold text-white">Top Players</h3>
              </div>
              
              <div className="space-y-3">
                {topScores.map((entry) => (
                  <div key={entry.rank} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        entry.rank === 1 ? "bg-yellow-500 text-black" :
                        entry.rank === 2 ? "bg-gray-400 text-black" :
                        entry.rank === 3 ? "bg-amber-600 text-black" :
                        "bg-gray-600 text-white"
                      }`}>
                        {entry.rank}
                      </div>
                      <span className="text-gray-300 text-sm">{entry.username}</span>
                    </div>
                    <span className="text-white font-mono text-sm">
                      {formatScore(entry.score)}
                    </span>
                  </div>
                ))}
              </div>
              
              <button
                onClick={() => navigate("/leaderboard")}
                className="w-full mt-4 game-button-secondary py-2 text-sm"
              >
                View Full Leaderboard
              </button>
            </div>

            {/* Recent Updates */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-bold text-white mb-4">Latest Updates</h3>
              <div className="space-y-3 text-sm text-gray-300">
                <div className="border-l-2 border-purple-400 pl-3">
                  <div className="font-medium text-white">New Power-ups Added!</div>
                  <div className="text-xs text-gray-400">Magic Shield and Score Multiplier</div>
                </div>
                <div className="border-l-2 border-green-400 pl-3">
                  <div className="font-medium text-white">Mobile Optimization</div>
                  <div className="text-xs text-gray-400">Better touch controls and UI scaling</div>
                </div>
                <div className="border-l-2 border-blue-400 pl-3">
                  <div className="font-medium text-white">Guest Play Enhanced</div>
                  <div className="text-xs text-gray-400">Local progress saving and account merging</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      {showGuestCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4">
            <GuestContinueCard
              onSignUp={handleSignUpFromCard}
              onContinueAsGuest={handleContinueAsGuest}
            />
          </div>
        </div>
      )}
    </div>
  );
}
