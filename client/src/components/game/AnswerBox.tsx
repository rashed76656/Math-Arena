import { useState, useEffect, useRef } from "react";
import { Calculator, Send } from "lucide-react";
import { useGameState } from "../../lib/stores/useGameState";
import { useAudio } from "../../lib/stores/useAudio";
import { useIsMobile } from "../../hooks/use-is-mobile";

interface AnswerBoxProps {
  onAnswer: (answer: number) => void;
  timeRemaining: number;
}

export default function AnswerBox({ onAnswer, timeRemaining }: AnswerBoxProps) {
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  const { currentQuestion, combo } = useGameState();
  const { playSuccess, playHit } = useAudio();

  // Focus input when question changes
  useEffect(() => {
    if (currentQuestion && inputRef.current && !isMobile) {
      inputRef.current.focus();
    }
  }, [currentQuestion, isMobile]);

  // Clear feedback after animation
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 500);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Clear shaking animation
  useEffect(() => {
    if (isShaking) {
      const timer = setTimeout(() => setIsShaking(false), 600);
      return () => clearTimeout(timer);
    }
  }, [isShaking]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || !currentQuestion) return;

    const numericAnswer = parseInt(answer, 10);
    if (isNaN(numericAnswer)) return;

    const isCorrect = numericAnswer === currentQuestion.answer;

    if (isCorrect) {
      setFeedback("correct");
      playSuccess();
    } else {
      setFeedback("incorrect");
      setIsShaking(true);
      playHit();
    }

    onAnswer(numericAnswer);
    setAnswer("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers (including negative)
    if (value === "" || /^-?\d+$/.test(value)) {
      setAnswer(value);
    }
  };

  // Mobile number pad
  const handleNumberClick = (num: string) => {
    if (num === "⌫") {
      setAnswer(prev => prev.slice(0, -1));
    } else if (num === "±") {
      setAnswer(prev => prev.startsWith("-") ? prev.slice(1) : "-" + prev);
    } else {
      setAnswer(prev => prev + num);
    }
  };

  // Show loading state but keep the math box structure
  if (!currentQuestion) {
    return (
      <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 border border-gray-600">
        <div className="text-center text-gray-400 mb-4">
          <Calculator className="w-8 h-8 mx-auto mb-2" />
          <p>Loading next question...</p>
        </div>

        {/* Keep input form structure for consistency */}
        <form className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Preparing next question..."
              className="flex-1 game-input text-lg text-center"
              disabled
            />
            <button
              type="button"
              disabled
              className="game-button px-4 opacity-50 cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>

        {/* Mobile Number Pad - disabled */}
        {isMobile && (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "±", "0", "⌫"].map((num) => (
              <button
                key={num}
                disabled
                className="game-button-secondary h-12 text-lg font-bold opacity-50 cursor-not-allowed"
                type="button"
              >
                {num}
              </button>
            ))}
          </div>
        )}

        {/* Progress bar placeholder */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Time Remaining</span>
            <span>--</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
            <div className="h-full bg-gray-600 w-0 transition-all duration-1000" />
          </div>
        </div>
      </div>
    );
  }

  const timePercent = Math.max(0, (timeRemaining / 30000) * 100);
  const isLowTime = timePercent < 25;

  return (
    <div className={`bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 border-2 transition-all duration-200 ${
      feedback === "correct" ? "border-green-400 bg-green-900/20" :
      feedback === "incorrect" ? "border-red-400 bg-red-900/20" :
      isLowTime ? "border-yellow-400" : "border-purple-400"
    } ${isShaking ? "animate-pulse" : ""}`}>

      {/* Question */}
      <div className="text-center mb-6">
          <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg p-4 mb-4 border border-blue-400/30">
            <div className="text-2xl lg:text-3xl font-bold text-white mb-2 font-mono tracking-wide">
              {currentQuestion.text}
            </div>
            <div className="text-xs text-blue-200 uppercase tracking-widest">
              {currentQuestion.type} • {currentQuestion.difficulty}
            </div>
          </div>
        </div>
      {combo > 0 && (
        <div className="text-center mb-4">
          <span className="px-3 py-1 bg-green-600 text-white text-xs rounded-full font-bold animate-pulse">
            {combo}x COMBO!
          </span>
        </div>
      )}


      {/* Answer Input Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={answer}
            onChange={handleInputChange}
            placeholder="Enter your answer..."
            className="flex-1 game-input text-lg text-center"
            autoComplete="off"
            aria-label="Math answer input"
            maxLength={10}
          />
          <button
            type="submit"
            disabled={!answer.trim()}
            className="game-button px-4 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Submit answer"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>

      {/* Mobile Number Pad */}
      {isMobile && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "±", "0", "⌫"].map((num) => (
            <button
              key={num}
              onClick={() => handleNumberClick(num)}
              className="game-button-secondary h-12 text-lg font-bold hover:bg-blue-600/20 transition-all duration-150 active:scale-95 active:bg-blue-500/30"
              type="button"
            >
              {num}
            </button>
          ))}
        </div>
      )}

      {/* Time Progress Bar */}
      <div className="mt-4">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Time Remaining</span>
          <span>{Math.ceil(timeRemaining / 1000)}s</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ${
              isLowTime ? "bg-red-400" : "bg-purple-400"
            }`}
            style={{ width: `${timePercent}%` }}
            role="progressbar"
            aria-valuenow={timePercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Time remaining: ${Math.ceil(timeRemaining / 1000)} seconds`}
          />
        </div>
      </div>

      {/* Feedback Messages */}
      {feedback === "correct" && (
        <div className="mt-2 text-center text-green-300 font-bold animate-bounce">
          ✓ Correct! Well done!
        </div>
      )}
      {feedback === "incorrect" && (
        <div className="mt-2 text-center text-red-300 font-bold">
          ✗ Incorrect. The answer was {currentQuestion.answer}
        </div>
      )}

      {/* Keyboard Shortcut Hint */}
      {!isMobile && (
        <div className="mt-2 text-center text-xs text-gray-500">
          Press Enter to submit
        </div>
      )}
    </div>
  );
}