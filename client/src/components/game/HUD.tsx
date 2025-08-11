import { useGameState } from "../../lib/stores/useGameState";
import { useAuth } from "../../lib/stores/useAuth";
import { formatTime, formatScore, calculateAccuracy, getPowerUpCooldownProgress } from "../../lib/gameUtils";
import { Heart, Zap, Shield, Timer, Target } from "lucide-react";

interface HUDProps {
  timeRemaining?: number;
}

export default function HUD({ timeRemaining }: HUDProps) {
  const {
    score,
    health,
    maxHealth,
    wave,
    combo,
    correctAnswers,
    questionsAnswered,
    timeElapsed,
    powerUps,
    usePowerUp,
    difficulty
  } = useGameState();

  const { isAuthenticated, user } = useAuth();
  const accuracy = calculateAccuracy(correctAnswers, questionsAnswered);

  const handlePowerUpClick = (powerUpType: string) => {
    const powerUp = powerUps.find(p => p.type === powerUpType);
    if (powerUp) {
      const cooldownProgress = getPowerUpCooldownProgress(powerUp);
      if (cooldownProgress >= 1) {
        usePowerUp(powerUpType);
      }
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Top HUD */}
      <div className="flex justify-between items-start p-4 pointer-events-auto">
        {/* Left side - Player info */}
        <div className="flex flex-col gap-2">
          <div className="hud-panel">
            <div className="text-xs text-gray-300 mb-1">
              {isAuthenticated ? user?.username : "Guest Player"}
            </div>
            <div className="text-lg font-bold text-white">
              Score: {formatScore(score)}
            </div>
          </div>

          <div className="hud-panel">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-400" />
              <div className="flex gap-1">
                {Array.from({ length: Math.max(health, 0) }, (_, i) => (
                  <Heart
                    key={i}
                    className={`w-6 h-6 text-red-500 fill-red-500 transition-all duration-300 ${
                      health <= 2 ? 'animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]' : ''
                    }`}
                  />
                ))}
                {Array.from({ length: Math.max(5 - health, 0) }, (_, i) => (
                  <Heart
                    key={`empty-${i}`}
                    className="w-6 h-6 text-gray-600 opacity-30"
                  />
                ))}
              </div>
              <span className="text-sm text-white">{health}/{maxHealth}</span>
            </div>
          </div>
        </div>

        {/* Right side - Game stats */}
        <div className="flex flex-col gap-2 text-right">
          {/* Wave and Difficulty Info */}
          <div className="text-center">
            <div className="text-xl font-bold text-blue-300">
              Wave {wave}
            </div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">
              {difficulty} Mode
            </div>
            {combo > 0 && (
              <div className="mt-1 px-2 py-1 bg-orange-500/20 border border-orange-400 rounded text-orange-300 text-xs font-bold">
                {combo}x COMBO!
              </div>
            )}
          </div>

          <div className="hud-panel">
            <div className="flex items-center justify-end gap-2">
              <Target className="w-4 h-4 text-green-400" />
              <div>
                <div className="text-xs text-gray-300">Combo</div>
                <div className="text-lg font-bold text-green-300">{combo}x</div>
              </div>
            </div>
          </div>

          <div className="hud-panel">
            <div className="text-xs text-gray-300">Accuracy</div>
            <div className="text-sm font-bold text-blue-300">{accuracy}%</div>
          </div>
        </div>
      </div>

      {/* Question timer (if timeRemaining provided) */}
      {timeRemaining !== undefined && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 pointer-events-auto">
          <div className="hud-panel">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-yellow-400" />
              <div className="text-lg font-mono">
                {formatTime(timeRemaining)}
              </div>
              <div
                className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden"
                aria-label={`Time remaining: ${formatTime(timeRemaining)}`}
              >
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-red-400 transition-all duration-1000"
                  style={{
                    width: `${Math.max(0, (timeRemaining / 30000) * 100)}%`
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom HUD - Power-ups */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 pointer-events-auto">
        <div className="flex gap-2">
          {powerUps.map((powerUp) => {
            const cooldownProgress = getPowerUpCooldownProgress(powerUp);
            const isReady = cooldownProgress >= 1;

            return (
              <button
                key={powerUp.id}
                onClick={() => handlePowerUpClick(powerUp.type)}
                disabled={!isReady}
                className={`relative w-12 h-12 rounded-lg border-2 transition-all ${
                  isReady
                    ? "border-white bg-purple-600 hover:bg-purple-500 cursor-pointer"
                    : "border-gray-600 bg-gray-800 cursor-not-allowed opacity-50"
                }`}
                title={`${powerUp.name}: ${powerUp.description}`}
                aria-label={`${powerUp.name} power-up ${isReady ? "ready" : "on cooldown"}`}
              >
                {/* Power-up icon */}
                <div className="flex items-center justify-center w-full h-full">
                  {powerUp.type === "freeze" && <Zap className="w-6 h-6 text-cyan-300" />}
                  {powerUp.type === "multiply" && <Target className="w-6 h-6 text-yellow-300" />}
                  {powerUp.type === "heal" && <Heart className="w-6 h-6 text-green-300" />}
                  {powerUp.type === "shield" && <Shield className="w-6 h-6 text-blue-300" />}
                </div>

                {/* Cooldown overlay */}
                {!isReady && (
                  <div
                    className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center"
                    style={{
                      background: `conic-gradient(transparent ${cooldownProgress * 360}deg, rgba(0,0,0,0.8) 0deg)`
                    }}
                  >
                    <div className="text-xs font-bold text-white">
                      {Math.ceil((1 - cooldownProgress) * (powerUp.cooldown / 1000))}s
                    </div>
                  </div>
                )}

                {/* Active indicator */}
                {powerUp.active && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Game time (bottom right) */}
      <div className="absolute bottom-4 right-4 pointer-events-auto">
        <div className="hud-panel text-sm">
          <div className="text-xs text-gray-300 mb-1">Time Played</div>
          <div className="font-mono">{formatTime(timeElapsed)}</div>
        </div>
      </div>
    </div>
  );
}