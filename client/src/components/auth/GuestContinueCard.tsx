import { Users, Save, ArrowRight } from "lucide-react";
import { useAuth } from "../../lib/stores/useAuth";

interface GuestContinueCardProps {
  onSignUp: () => void;
  onContinueAsGuest: () => void;
  showSignupBenefit?: boolean;
}

export default function GuestContinueCard({ 
  onSignUp, 
  onContinueAsGuest, 
  showSignupBenefit = false 
}: GuestContinueCardProps) {
  const { guestSession } = useAuth();

  const localScoreCount = guestSession?.localScores?.length || 0;

  return (
    <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 border border-gray-600 max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-4">
        <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
        <h3 className="text-lg font-bold text-white">
          {showSignupBenefit ? "Save Your Progress!" : "Choose How to Play"}
        </h3>
      </div>

      {/* Current Progress (if any) */}
      {localScoreCount > 0 && (
        <div className="bg-yellow-900/30 border border-yellow-600/30 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 text-yellow-200">
            <Save className="w-4 h-4" />
            <span className="text-sm">
              You have {localScoreCount} local game{localScoreCount !== 1 ? 's' : ''} saved
            </span>
          </div>
        </div>
      )}

      {/* Benefits of signing up */}
      <div className="space-y-3 mb-6">
        <div className="text-sm text-gray-300">
          {showSignupBenefit ? (
            <p>Create an account to keep your progress and unlock more features:</p>
          ) : (
            <p>Playing as guest vs. signed in:</p>
          )}
        </div>
        
        <div className="grid grid-cols-1 gap-2 text-xs">
          <div className="flex items-center gap-2 text-green-300">
            <div className="w-2 h-2 bg-green-400 rounded-full" />
            <span>Save scores to global leaderboard</span>
          </div>
          <div className="flex items-center gap-2 text-green-300">
            <div className="w-2 h-2 bg-green-400 rounded-full" />
            <span>Track your progress over time</span>
          </div>
          <div className="flex items-center gap-2 text-green-300">
            <div className="w-2 h-2 bg-green-400 rounded-full" />
            <span>Compete with friends</span>
          </div>
          <div className="flex items-center gap-2 text-green-300">
            <div className="w-2 h-2 bg-green-400 rounded-full" />
            <span>Unlock achievements and rewards</span>
          </div>
        </div>

        <div className="text-xs text-gray-400 mt-3">
          As a guest: progress saved locally, instant play, limited features
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <button
          onClick={onSignUp}
          className="game-button w-full flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          {showSignupBenefit ? "Sign Up to Save Progress" : "Create Account"}
        </button>
        
        <button
          onClick={onContinueAsGuest}
          className="game-button-secondary w-full flex items-center justify-center gap-2"
        >
          <ArrowRight className="w-4 h-4" />
          Continue as Guest
        </button>
      </div>

      {/* Merge offer (if guest has local scores) */}
      {localScoreCount > 0 && (
        <div className="mt-4 text-center">
          <p className="text-xs text-blue-300">
            💡 Sign up now and we'll merge your local scores into your account!
          </p>
        </div>
      )}
    </div>
  );
}
