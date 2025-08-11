import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Play, Home, Trophy, Share, Save, Target, Clock, Zap } from "lucide-react";
import { useAuth } from "../lib/stores/useAuth";
import { useGameState } from "../lib/stores/useGameState";
import { formatTime, formatScore, calculateAccuracy } from "../lib/gameUtils";
import AuthModal from "../components/auth/AuthModal";
import confetti from "react-confetti";

export default function GameResult() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const {
    isAuthenticated,
    isGuest,
    user,
    guestSession,
    saveGuestScore,
  } = useAuth();

  const { 
    correctAnswers, 
    questionsAnswered, 
    maxCombo,
    resetGame 
  } = useGameState();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [isScoreSaved, setIsScoreSaved] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Get game results from location state
  const results = location.state || {
    score: 0,
    wave: 1,
    timeElapsed: 0,
    difficulty: "easy",
    gameSettings: { mode: "classic" }
  };

  const accuracy = calculateAccuracy(correctAnswers, questionsAnswered);
  const isNewPersonalBest = user?.stats?.totalScore ? results.score > user.stats.totalScore : true;

  useEffect(() => {
    // Show confetti for good scores
    if (results.score > 1000 || results.wave > 5) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }

    // Auto-save for authenticated users
    if (isAuthenticated) {
      saveScoreToServer();
    } else if (isGuest) {
      // Save to local storage for guests
      saveGuestScore(results.score, accuracy, results.wave);
      setShowSavePrompt(true);
    }
  }, [results, isAuthenticated, isGuest, accuracy, saveGuestScore]);

  const saveScoreToServer = async () => {
    try {
      const response = await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          score: results.score,
          wave: results.wave,
          accuracy,
          difficulty: results.difficulty,
          mode: results.gameSettings.mode,
          timeElapsed: results.timeElapsed,
          correctAnswers,
          totalQuestions: questionsAnswered,
          maxCombo,
        }),
      });

      if (response.ok) {
        setIsScoreSaved(true);
        console.log("Score saved to server");
      }
    } catch (error) {
      console.error("Failed to save score:", error);
    }
  };

  const handlePlayAgain = () => {
    resetGame();
    navigate("/lobby");
  };

  const handleShareScore = async () => {
    const shareText = `I just scored ${formatScore(results.score)} points and survived ${results.wave} waves in Math Survival Arena! 🎮🧮`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Math Survival Arena - My Score",
          text: shareText,
          url: window.location.origin,
        });
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(shareText + " " + window.location.origin);
        alert("Score copied to clipboard!");
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(shareText + " " + window.location.origin);
      alert("Score copied to clipboard!");
    }
  };

  const handleSignUpToSave = () => {
    setShowAuthModal(true);
  };

  const getRankEmoji = (score: number) => {
    if (score >= 10000) return "🏆";
    if (score >= 5000) return "🥇";
    if (score >= 2000) return "🥈";
    if (score >= 1000) return "🥉";
    return "⭐";
  };

  const getPerformanceMessage = () => {
    if (accuracy >= 90 && results.wave >= 10) return "Math Master! 🧮👑";
    if (accuracy >= 80 && results.wave >= 7) return "Excellent Work! 🎯";
    if (accuracy >= 70 && results.wave >= 5) return "Great Job! 🌟";
    if (accuracy >= 60 && results.wave >= 3) return "Well Done! 💪";
    return "Keep Practicing! 📚";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {/* Confetti effect would go here - using a simple animated celebration instead */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-6xl animate-bounce">🎉</div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">
              {getRankEmoji(results.score)}
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Game Complete!
            </h1>
            <p className="text-xl text-gray-300">
              {getPerformanceMessage()}
            </p>
            {isNewPersonalBest && isAuthenticated && (
              <div className="mt-2 text-yellow-300 font-bold animate-pulse">
                🎉 New Personal Best!
              </div>
            )}
          </div>

          {/* Score Display */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700 mb-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-300 mb-2">
                  {formatScore(results.score)}
                </div>
                <div className="text-gray-400">Final Score</div>
              </div>
              
              <div className="text-center">
                <div className="text-4xl font-bold text-green-300 mb-2">
                  {results.wave}
                </div>
                <div className="text-gray-400">Waves Survived</div>
              </div>
              
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-300 mb-2">
                  {accuracy}%
                </div>
                <div className="text-gray-400">Accuracy</div>
              </div>
              
              <div className="text-center">
                <div className="text-4xl font-bold text-yellow-300 mb-2">
                  {maxCombo}x
                </div>
                <div className="text-gray-400">Best Combo</div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Detailed Stats */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-300" />
                Game Statistics
              </h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-700">
                  <span className="text-gray-300">Questions Answered</span>
                  <span className="text-white font-mono">{questionsAnswered}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-700">
                  <span className="text-gray-300">Correct Answers</span>
                  <span className="text-green-300 font-mono">{correctAnswers}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-700">
                  <span className="text-gray-300">Wrong Answers</span>
                  <span className="text-red-300 font-mono">{questionsAnswered - correctAnswers}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-700">
                  <span className="text-gray-300">Time Played</span>
                  <span className="text-blue-300 font-mono">{formatTime(results.timeElapsed)}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-700">
                  <span className="text-gray-300">Difficulty</span>
                  <span className="text-yellow-300 font-mono capitalize">{results.difficulty}</span>
                </div>
                
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-300">Game Mode</span>
                  <span className="text-purple-300 font-mono capitalize">{results.gameSettings.mode}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-6">
              {/* Save Score Section */}
              {!isAuthenticated && showSavePrompt && (
                <div className="bg-blue-900/30 border border-blue-600/30 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Save className="w-5 h-5 text-blue-300" />
                    <h3 className="text-lg font-bold text-white">Save Your Score</h3>
                  </div>
                  <p className="text-blue-200 mb-4">
                    Your score is saved locally. Create an account to save it to the global leaderboard and track your progress!
                  </p>
                  <div className="space-y-2">
                    <button
                      onClick={handleSignUpToSave}
                      className="game-button w-full"
                    >
                      Sign Up to Save Progress
                    </button>
                    <div className="text-xs text-blue-300 text-center">
                      We'll merge your local scores into your account
                    </div>
                  </div>
                </div>
              )}

              {isScoreSaved && (
                <div className="bg-green-900/30 border border-green-600/30 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Trophy className="w-5 h-5 text-green-300" />
                    <h3 className="text-lg font-bold text-white">Score Saved!</h3>
                  </div>
                  <p className="text-green-200">
                    Your score has been saved to the global leaderboard.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-bold text-white mb-4">What's Next?</h3>
                
                <div className="space-y-3">
                  <button
                    onClick={handlePlayAgain}
                    className="game-button w-full flex items-center justify-center gap-2"
                  >
                    <Play className="w-5 h-5" />
                    Play Again
                  </button>
                  
                  <button
                    onClick={handleShareScore}
                    className="game-button-secondary w-full flex items-center justify-center gap-2"
                  >
                    <Share className="w-5 h-5" />
                    Share Score
                  </button>
                  
                  <button
                    onClick={() => navigate("/leaderboard")}
                    className="game-button-secondary w-full flex items-center justify-center gap-2"
                  >
                    <Trophy className="w-5 h-5" />
                    View Leaderboard
                  </button>
                  
                  <button
                    onClick={() => navigate("/")}
                    className="game-button-secondary w-full flex items-center justify-center gap-2"
                  >
                    <Home className="w-5 h-5" />
                    Back to Home
                  </button>
                </div>
              </div>

              {/* Achievement-style bonuses */}
              {(accuracy >= 90 || results.wave >= 10 || results.score >= 5000) && (
                <div className="bg-yellow-900/30 border border-yellow-600/30 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Zap className="w-5 h-5 text-yellow-300" />
                    <h3 className="text-lg font-bold text-white">Achievements</h3>
                  </div>
                  <div className="space-y-2">
                    {accuracy >= 90 && (
                      <div className="flex items-center gap-2 text-yellow-200">
                        <span className="text-xl">🎯</span>
                        <span>Sharpshooter - 90%+ Accuracy</span>
                      </div>
                    )}
                    {results.wave >= 10 && (
                      <div className="flex items-center gap-2 text-yellow-200">
                        <span className="text-xl">🌊</span>
                        <span>Wave Master - Survived 10+ Waves</span>
                      </div>
                    )}
                    {results.score >= 5000 && (
                      <div className="flex items-center gap-2 text-yellow-200">
                        <span className="text-xl">💰</span>
                        <span>High Roller - 5000+ Points</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultTab="signup"
      />
    </div>
  );
}
