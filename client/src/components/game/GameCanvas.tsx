import { useEffect, useRef, useCallback } from "react";
import { GameEngine } from "./GameEngine";
import { useGameState } from "../../lib/stores/useGameState";
import { useAudio } from "../../lib/stores/useAudio";

interface GameCanvasProps {
  onMonsterDestroyed?: (monsterId: string) => void;
  onPlayerDamaged?: (damage: number) => void;
}

export default function GameCanvas({ onMonsterDestroyed, onPlayerDamaged }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const { 
    phase, 
    wave, 
    difficulty, 
    monsters, 
    removeMonster, 
    addMonster,
    canSpawnMonster,
    setIsSpawningMonster 
  } = useGameState();
  const { playHit } = useAudio();

  const handleMonsterReachPlayer = useCallback((damage: number) => {
    playHit();
    onPlayerDamaged?.(damage);
  }, [playHit, onPlayerDamaged]);

  const handleMonsterDestroyed = useCallback((monsterId: string) => {
    console.log("Monster destroyed callback:", monsterId);
    removeMonster(monsterId);
    onMonsterDestroyed?.(monsterId);
  }, [onMonsterDestroyed, removeMonster]);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize game engine
    engineRef.current = new GameEngine(canvasRef.current);
    
    // Store engine reference on canvas for external access
    (canvasRef.current as any).gameEngine = engineRef.current;
    
    engineRef.current.setCallbacks({
      onMonsterReachPlayer: handleMonsterReachPlayer,
      onMonsterDestroyed: handleMonsterDestroyed,
      onStateUpdate: (state) => {
        // Sync monsters from engine to game state
        const engineMonsters = state.monsters.map(m => m.data);
        const gameStateMonsters = monsters;
        
        // Add new monsters that don't exist in game state
        engineMonsters.forEach(engineMonster => {
          if (!gameStateMonsters.find(gsm => gsm.id === engineMonster.id)) {
            addMonster(engineMonster);
          }
        });
      }
    });

    return () => {
      engineRef.current?.destroy();
    };
  }, []);

  useEffect(() => {
    if (!engineRef.current) return;

    // Control game engine based on phase
    switch (phase) {
      case "playing":
        engineRef.current.start();
        break;
      case "paused":
        engineRef.current.pause();
        break;
      case "gameOver":
      case "menu":
        engineRef.current.stop();
        break;
    }
  }, [phase]);

  // Remove automatic wave spawning - now controlled by Game.tsx for sequential spawning

  // Handle canvas resize
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current) return;
      
      const container = canvasRef.current.parentElement;
      if (container) {
        const rect = container.getBoundingClientRect();
        const aspectRatio = 800 / 600; // Canvas aspect ratio
        
        let width = rect.width;
        let height = width / aspectRatio;
        
        if (height > rect.height) {
          height = rect.height;
          width = height * aspectRatio;
        }
        
        canvasRef.current.style.width = `${width}px`;
        canvasRef.current.style.height = `${height}px`;
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-900 rounded-lg overflow-hidden">
      <canvas
        ref={canvasRef}
        className="game-canvas border border-gray-700 rounded"
        tabIndex={0}
        aria-label="Math Arena Game Canvas"
      />
    </div>
  );
}
