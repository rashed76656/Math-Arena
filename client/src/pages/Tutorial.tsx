import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Play, BookOpen, Target, Zap, Heart } from "lucide-react";
import GameCanvas from "../components/game/GameCanvas";
import HUD from "../components/game/HUD";
import AnswerBox from "../components/game/AnswerBox";
import { useGameState } from "../lib/stores/useGameState";
import { questionGenerator } from "../lib/QuestionGenerator";

const tutorialSteps = [
  {
    id: 1,
    title: "Welcome to Math Survival Arena!",
    content: "In this game, you'll answer math questions to destroy monsters and survive waves. Let's learn the basics!",
    icon: BookOpen,
    showGame: false,
  },
  {
    id: 2,
    title: "The Arena",
    content: "This is your survival arena. You're the blue circle in the center. Monsters will spawn from the edges and move toward you.",
    icon: Target,
    showGame: true,
    showHUD: true,
  },
  {
    id: 3,
    title: "Answer Questions",
    content: "When a question appears, type your answer and press Enter (or tap Submit on mobile). Correct answers destroy monsters!",
    icon: Target,
    showGame: true,
    showHUD: true,
    showAnswerBox: true,
    practiceMode: true,
  },
  {
    id: 4,
    title: "Health & Combos",
    content: "You have 5 health points (hearts). If monsters reach you, you lose health. Build combos by answering correctly in a row for bonus points!",
    icon: Heart,
    showGame: true,
    showHUD: true,
  },
  {
    id: 5,
    title: "Power-ups",
    content: "Use power-ups to help survive! Freeze monsters, multiply your score, heal yourself, or activate a protective shield.",
    icon: Zap,
    showGame: true,
    showHUD: true,
  },
  {
    id: 6,
    title: "Ready to Play!",
    content: "You've learned the basics! Time for a practice round. Answer 3 questions correctly to complete the tutorial.",
    icon: Play,
    showGame: true,
    showHUD: true,
    showAnswerBox: true,
    finalPractice: true,
  },
];

export default function Tutorial() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [practiceQuestions, setPracticeQuestions] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  
  const { 
    setPhase, 
    setCurrentQuestion, 
    currentQuestion, 
    answerQuestion, 
    resetGame,
    correctAnswers,
  } = useGameState();

  const step = tutorialSteps[currentStep];

  useEffect(() => {
    // Initialize tutorial
    resetGame();
    setPhase("tutorial");
    
    return () => {
      setPhase("menu");
      resetGame();
    };
  }, [resetGame, setPhase]);

  useEffect(() => {
    // Generate practice question for interactive steps
    if (step.practiceMode || step.finalPractice) {
      if (!currentQuestion) {
        const question = questionGenerator.generateQuestion("easy", 1);
        setCurrentQuestion(question);
      }
    }
  }, [step, currentQuestion, setCurrentQuestion]);

  const handleAnswer = (answer: number) => {
    if (!currentQuestion) return;
    
    const isCorrect = answerQuestion(answer);
    
    if (isCorrect) {
      setPracticeQuestions(prev => prev + 1);
      
      // Check if tutorial is complete
      if (step.finalPractice && practiceQuestions >= 2) {
        setIsCompleted(true);
        return;
      }
      
      // Generate next question after short delay
      setTimeout(() => {
        const question = questionGenerator.generateQuestion("easy", 1);
        setCurrentQuestion(question);
      }, 1000);
    } else {
      // For tutorial, generate new question even on wrong answer after delay
      setTimeout(() => {
        const question = questionGenerator.generateQuestion("easy", 1);
        setCurrentQuestion(question);
      }, 2000);
    }
  };

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
      setPracticeQuestions(0);
      setCurrentQuestion(null);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setPracticeQuestions(0);
      setCurrentQuestion(null);
    }
  };

  const completeTutorial = () => {
    // Send tutorial completion to server if needed
    navigate("/lobby");
  };

  const skipTutorial = () => {
    navigate("/lobby");
  };

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center bg-gray-800/90 backdrop-blur-sm rounded-xl p-8 border border-gray-700 max-w-md mx-4">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-white mb-4">Tutorial Complete!</h2>
          <p className="text-gray-300 mb-6">
            Great job! You answered {correctAnswers} questions correctly. 
            You're ready to enter the arena and face real challenges!
          </p>
          
          <div className="space-y-3">
            <button
              onClick={completeTutorial}
              className="game-button w-full"
            >
              Enter the Arena!
            </button>
            <button
              onClick={() => navigate("/")}
              className="game-button-secondary w-full"
            >
              Back to Home
            </button>
          </div>
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
          <h1 className="text-xl font-bold text-white">Tutorial</h1>
          <div className="text-sm text-gray-300">
            Step {currentStep + 1} of {tutorialSteps.length}
          </div>
        </div>
        
        <button
          onClick={skipTutorial}
          className="game-button-secondary px-4 py-2"
        >
          Skip Tutorial
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-800 h-2">
        <div 
          className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 transition-all duration-300"
          style={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4">
        {step.showGame ? (
          <div className="grid lg:grid-cols-3 gap-4 h-[calc(100vh-120px)]">
            {/* Game Area */}
            <div className="lg:col-span-2 relative">
              <GameCanvas />
              {step.showHUD && <HUD />}
            </div>
            
            {/* Tutorial Panel + Answer Box */}
            <div className="space-y-4">
              {/* Tutorial Instruction Panel */}
              <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 border border-purple-400">
                <div className="flex items-center gap-3 mb-4">
                  <step.icon className="w-6 h-6 text-purple-300" />
                  <h2 className="text-lg font-bold text-white">{step.title}</h2>
                </div>
                <p className="text-gray-300 mb-4">{step.content}</p>
                
                {step.finalPractice && (
                  <div className="bg-green-900/30 border border-green-600/30 rounded-lg p-3 mb-4">
                    <div className="text-green-200 text-sm">
                      Progress: {practiceQuestions}/3 questions answered correctly
                    </div>
                  </div>
                )}
                
                {/* Navigation Buttons */}
                <div className="flex justify-between">
                  <button
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    className="game-button-secondary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Previous
                  </button>
                  
                  {!step.finalPractice && (
                    <button
                      onClick={nextStep}
                      disabled={currentStep === tutorialSteps.length - 1}
                      className="game-button px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      Next
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              
              {/* Answer Box for Practice */}
              {step.showAnswerBox && currentQuestion && (
                <AnswerBox
                  onAnswer={handleAnswer}
                  timeRemaining={30000} // 30 seconds for tutorial
                />
              )}
            </div>
          </div>
        ) : (
          /* Welcome Screen */
          <div className="flex items-center justify-center h-[calc(100vh-120px)]">
            <div className="text-center bg-gray-800/90 backdrop-blur-sm rounded-xl p-8 border border-gray-700 max-w-2xl mx-4">
              <step.icon className="w-16 h-16 text-purple-300 mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-white mb-4">{step.title}</h2>
              <p className="text-lg text-gray-300 mb-8">{step.content}</p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={nextStep}
                  className="game-button text-lg px-8 py-4 flex items-center justify-center gap-2"
                >
                  Let's Start!
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={skipTutorial}
                  className="game-button-secondary text-lg px-8 py-4"
                >
                  Skip Tutorial
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
