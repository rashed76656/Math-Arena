import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Pause, Play, Volume2, VolumeX, Home } from "lucide-react";
import { useGameState } from "../lib/stores/useGameState";
import { useAuth } from "../lib/stores/useAuth";
import { useAudio } from "../lib/stores/useAudio";
import { useAchievements } from "../lib/stores/useAchievements";
import { questionGenerator } from "../lib/QuestionGenerator";
import { powerUpEffects } from "../lib/PowerUpEffects";
import GameCanvas from "../components/game/GameCanvas";
import HUD from "../components/game/HUD";
import AnswerBox from "../components/game/AnswerBox";

export default function Game() {
  const navigate = useNavigate();
  const location = useLocation();
  const gameSettings = location.state?.gameSettings;
  
  const {
    phase,
    setPhase,
    currentQuestion,
    setCurrentQuestion,
    answerQuestion,
    takeDamage,
    addScore,
    nextWave,
    updateTimeElapsed,
    wave,
    score,
    health,
    monsters,
    difficulty,
    timeElapsed,
    resetGame,
    canSpawnMonster,
    setIsSpawningMonster,
    setLastSpawnTime,
    isSpawningMonster,
    removeMonster,
    addMonster,
    questionsAnswered,
  } = useGameState();

  const { isAuthenticated, saveGuestScore } = useAuth();
  const { isMuted, toggleMute, backgroundMusic } = useAudio();
  const { updateProgress } = useAchievements();

  const [questionTimeRemaining, setQuestionTimeRemaining] = useState(30000);
  const [questionStartTime, setQuestionStartTime] = useState(0);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [gameStartTime] = useState(Date.now());

  const generateNextQuestion = useCallback(() => {
    const question = questionGenerator.generateQuestion(difficulty, wave);
    setCurrentQuestion(question);
    setQuestionStartTime(Date.now());
    setQuestionTimeRemaining(gameSettings?.timeLimit * 1000 || 30000);
    console.log("Generated question:", question);
  }, [difficulty, wave, setCurrentQuestion, gameSettings?.timeLimit]);

  // Initialize game
  useEffect(() => {
    console.log("Game initialized with settings:", gameSettings);
    resetGame();
    setPhase("playing");
    
    // Generate first question
    const firstQuestion = questionGenerator.generateQuestion(difficulty, 1);
    setCurrentQuestion(firstQuestion);
    setQuestionStartTime(Date.now());
    setQuestionTimeRemaining(gameSettings?.timeLimit * 1000 || 30000);

    // Start background music
    if (backgroundMusic && !isMuted) {
      backgroundMusic.play().catch(console.log);
    }

    return () => {
      setPhase("menu");
      if (backgroundMusic) {
        backgroundMusic.pause();
      }
    };
  }, [resetGame, setPhase, difficulty, setCurrentQuestion, gameSettings, backgroundMusic, isMuted]);

  // Question timer
  useEffect(() => {
    if (phase !== "playing" || !currentQuestion) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - questionStartTime;
      const remaining = Math.max(0, (gameSettings?.timeLimit * 1000 || 30000) - elapsed);
      
      setQuestionTimeRemaining(remaining);
      
      if (remaining <= 0) {
        // Time's up - treat as wrong answer
        handleAnswer(-999); // Invalid answer to trigger wrong answer logic
      }
    }, 100);

    return () => clearInterval(interval);
  }, [phase, currentQuestion, questionStartTime, gameSettings?.timeLimit]);

  // Game time tracker
  useEffect(() => {
    if (phase !== "playing") return;

    const interval = setInterval(() => {
      updateTimeElapsed(Date.now() - gameStartTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, gameStartTime, updateTimeElapsed]);

  // Immediate monster spawning - no delay, monster takes 5 seconds to reach player
  useEffect(() => {
    if (phase !== "playing" || !currentQuestion || monsters.length > 0 || isSpawningMonster) {
      return;
    }
    
    console.log("Spawning monster immediately for question:", currentQuestion.text);
    
    const gameCanvas = document.querySelector('.game-canvas') as HTMLCanvasElement;
    const gameEngine = gameCanvas && (gameCanvas as any).gameEngine;
    
    if (gameEngine && gameEngine.getState().monsters.length === 0 && monsters.length === 0) {
      setIsSpawningMonster(true);
      
      gameEngine.spawnMonster(
        wave, 
        difficulty, 
        currentQuestion.text, 
        currentQuestion.answer
      );
      
      setTimeout(() => setIsSpawningMonster(false), 100);
    }
  }, [phase, currentQuestion, monsters.length, isSpawningMonster, wave, difficulty]);

  // Wave progression logic - only advance wave when wave target is met
  useEffect(() => {
    // Only progress wave if no active (non-destroying) monsters and no current question
    const activeMonsters = monsters.filter(m => !m.isDestroying);
    
    // Wave should progress only when all monsters for this wave are defeated
    // and we've answered enough questions for this wave (e.g., 10 questions per wave)
    const questionsPerWave = 10;
    const currentWaveQuestions = questionsAnswered % questionsPerWave;
    const shouldAdvanceWave = currentWaveQuestions === 0 && questionsAnswered > 0;
    
    if (phase === "playing" && 
        activeMonsters.length === 0 && 
        !currentQuestion && 
        !isSpawningMonster && 
        shouldAdvanceWave) {
      console.log("Wave completed, starting next wave");
      
      // Delay before next wave to give visual feedback
      setTimeout(() => {
        const currentActiveMonsters = monsters.filter(m => !m.isDestroying);
        if (currentActiveMonsters.length === 0 && phase === "playing") { 
          nextWave();
          generateNextQuestion();
        }
      }, 1500);
    }
  }, [
    monsters, 
    currentQuestion, 
    phase, 
    isSpawningMonster,
    questionsAnswered,
    nextWave,
    generateNextQuestion
  ]);

  // Handle game over
  useEffect(() => {
    if (phase === "gameOver") {
      console.log("Game over - navigating to results");
      // Save score for guest players
      if (!isAuthenticated && score > 0) {
        saveGuestScore(score, (correctAnswersCount / questionsAnswered) * 100 || 0, wave);
      }
      
      // Navigate to results after short delay
      setTimeout(() => {
        navigate("/result", {
          state: {
            score,
            wave,
            timeElapsed,
            difficulty,
            gameSettings,
          }
        });
      }, 2000);
    }
  }, [phase, navigate, score, wave, timeElapsed, difficulty, gameSettings, isAuthenticated, saveGuestScore]);

  const handleAnswer = useCallback((answer: number) => {
    if (!currentQuestion) return;

    console.log("Answer submitted:", answer, "Correct answer:", currentQuestion.answer);
    
    const responseTime = Date.now() - questionStartTime;
    const isCorrect = answerQuestion(answer);
    
    if (isCorrect) {
      console.log("Correct answer!");
      
      // Add visual effects for correct answer
      powerUpEffects.addEffect("combo", 400, 300);
      powerUpEffects.addEffect("explosion", 400, 300, { 
        color: "#00ff00", 
        size: 80,
        intensity: 1.5 
      });
      
      // Update achievements for correct answers
      updateProgress("first_steps", 1);
      updateProgress("hundred_club", 1);
      updateProgress("perfect_score", 1);
      
      // Fast answer achievement
      if (responseTime < 5000) {
        updateProgress("speed_demon", 1);
      }
      
      // Destroy the monster that matches this equation
      if (monsters.length > 0) {
        const targetMonster = monsters.find(m => 
          m.equation === currentQuestion.text || 
          m.answer === currentQuestion.answer
        ) || monsters[0]; // Fallback to first monster if no equation match
        
        console.log("Destroying monster for correct answer:", targetMonster.id, "equation:", targetMonster.equation);
        
        // Use GameEngine to destroy monster immediately 
        const gameCanvas = document.querySelector('.game-canvas') as HTMLCanvasElement;
        if (gameCanvas && (gameCanvas as any).gameEngine) {
          // Destroy monster immediately
          (gameCanvas as any).gameEngine.destroyMonster(targetMonster.id, false);
          console.log("Monster destroyed for correct answer");
        }
        
        // Remove monster from game state immediately
        removeMonster(targetMonster.id);
        
        // Generate next question immediately for smooth gameplay
        setTimeout(() => {
          if (phase === "playing") {
            setCurrentQuestion(generateNextQuestion());
          }
        }, 100);
      }
      
      // Clear current question to allow new monster spawning
      setCurrentQuestion(null);
      
      // Generate next question after a short delay to allow animation
      setTimeout(() => {
        if (phase === "playing") { // Only generate if still playing
          generateNextQuestion();
        }
      }, 100); // Reduced delay for better responsiveness
    } else {
      console.log("Wrong answer!");
      
      // Add visual effect for wrong answer
      powerUpEffects.addScreenShake(300, 8);
      
      // Player takes damage from wrong answer or timeout
      takeDamage(1);
      
      // Generate new question immediately for wrong answers
      setTimeout(() => {
        if (phase === "playing") {
          generateNextQuestion();
        }
      }, 100);
    }
  }, [currentQuestion, answerQuestion, monsters, takeDamage, generateNextQuestion, questionStartTime, updateProgress, setCurrentQuestion, phase]);

  const handleMonsterReachPlayer = useCallback((damage: number) => {
    console.log("Monster reached player, taking damage:", damage);
    takeDamage(damage);
    
    // Reset current question when monster catches player
    setCurrentQuestion(null);
    
    // Generate new question after monster reaches player
    setTimeout(() => {
      generateNextQuestion();
    }, 500);
  }, [takeDamage, setCurrentQuestion, generateNextQuestion]);

  const handleMonsterDestroyed = useCallback((monsterId: string) => {
    console.log("Monster destroyed:", monsterId);
    // Add score bonus for destroying monsters
    addScore(5 * wave); // Scale with wave number
  }, [addScore, wave]);

  const handlePause = () => {
    if (phase === "playing") {
      setPhase("paused");
      setShowPauseModal(true);
      if (backgroundMusic) {
        backgroundMusic.pause();
      }
    }
  };

  const handleResume = () => {
    setPhase("playing");
    setShowPauseModal(false);
    setQuestionStartTime(Date.now()); // Reset question timer
    if (backgroundMusic && !isMuted) {
      backgroundMusic.play().catch(console.log);
    }
  };

  const handleQuitGame = () => {
    setPhase("menu");
    resetGame();
    navigate("/lobby");
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (phase === "playing") {
          handlePause();
        } else if (phase === "paused") {
          handleResume();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [phase]);

  const correctAnswersCount = useGameState(state => state.correctAnswers);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Game Controls (Top) */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <button
          onClick={handlePause}
          disabled={phase !== "playing"}
          className="hud-panel px-3 py-2 hover:bg-white/10 transition-colors disabled:opacity-50"
          aria-label={phase === "playing" ? "Pause game" : "Game paused"}
        >
          {phase === "playing" ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>
        
        <button
          onClick={toggleMute}
          className="hud-panel px-3 py-2 hover:bg-white/10 transition-colors"
          aria-label={isMuted ? "Unmute audio" : "Mute audio"}
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Main Game Area */}
      <div className="h-screen flex flex-col lg:flex-row">
        {/* Game Canvas */}
        <div className="flex-1 relative">
          <GameCanvas
            onMonsterDestroyed={handleMonsterDestroyed}
            onPlayerDamaged={handleMonsterReachPlayer}
          />
          <HUD timeRemaining={questionTimeRemaining} />
        </div>

        {/* Answer Input Area */}
        <div className="lg:w-96 p-4 bg-black/20 backdrop-blur-sm border-t lg:border-t-0 lg:border-l border-gray-700 flex items-center">
          {phase === "playing" && (
            <AnswerBox
              onAnswer={handleAnswer}
              timeRemaining={questionTimeRemaining}
            />
          )}
          
          {phase === "paused" && (
            <div className="w-full bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 border border-gray-600 text-center">
              <h2 className="text-xl font-bold text-white mb-4">Game Paused</h2>
              <p className="text-gray-300 mb-6">Take a break! Your progress is saved.</p>
              <div className="space-y-3">
                <button onClick={handleResume} className="game-button w-full">
                  Resume Game
                </button>
                <button onClick={handleQuitGame} className="game-button-secondary w-full">
                  Quit to Lobby
                </button>
              </div>
            </div>
          )}

          {phase === "gameOver" && (
            <div className="w-full bg-red-900/50 backdrop-blur-sm rounded-lg p-6 border border-red-600 text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Game Over!</h2>
              <p className="text-red-200 mb-4">
                You survived {wave} waves and scored {score} points!
              </p>
              <div className="animate-pulse text-gray-300">
                Preparing results...
              </div>
            </div>
          )}

          {!currentQuestion && phase === "playing" && monsters.length === 0 && (
            <div className="w-full bg-gradient-to-br from-green-900/60 to-emerald-800/40 backdrop-blur-sm rounded-lg p-6 border border-green-500 text-center transform transition-all duration-500 animate-pulse">
              <div className="text-4xl mb-3">🎉</div>
              <h2 className="text-xl font-bold text-white mb-2">Wave {wave} Complete!</h2>
              <p className="text-green-200 mb-4">
                Preparing next wave...
              </p>
              <div className="flex justify-center items-center gap-2 text-gray-300">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pause Modal */}
      {showPauseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-md mx-4 border border-gray-700 p-6">
            <h2 className="text-2xl font-bold text-white mb-4 text-center">Game Paused</h2>
            
            <div className="space-y-4 mb-6">
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-purple-300">{score}</div>
                    <div className="text-sm text-gray-400">Score</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-300">{wave}</div>
                    <div className="text-sm text-gray-400">Wave</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-300">{health}</div>
                    <div className="text-sm text-gray-400">Health</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-300">
                      {Math.round((correctAnswersCount / Math.max(questionsAnswered, 1)) * 100)}%
                    </div>
                    <div className="text-sm text-gray-400">Accuracy</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleResume}
                className="game-button w-full flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5" />
                Resume Game
              </button>
              
              <button
                onClick={handleQuitGame}
                className="game-button-secondary w-full flex items-center justify-center gap-2"
              >
                <Home className="w-5 h-5" />
                Quit to Lobby
              </button>
            </div>

            <div className="mt-4 text-center text-sm text-gray-400">
              Press ESC to resume quickly
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
