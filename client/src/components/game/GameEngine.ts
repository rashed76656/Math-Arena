import { Monster as MonsterClass } from "./Monster";
import { Monster as MonsterType } from "../../lib/stores/useGameState";
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  PLAYER_RADIUS,
  createMonster,
  getWaveMonsterCount,
  getWaveSpawnRate,
  checkCircleCollision,
  getMonsterDamage
} from "../../lib/gameUtils";

export interface GameEngineState {
  playerPosition: { x: number; y: number };
  monsters: MonsterClass[];
  lastSpawnTime: number;
  lastUpdateTime: number;
  isRunning: boolean;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private state: GameEngineState;
  private animationId: number | null = null;
  
  // Callbacks
  private onMonsterReachPlayer: (damage: number) => void = () => {};
  private onMonsterDestroyed: (monsterId: string) => void = () => {};
  private onStateUpdate: (state: GameEngineState) => void = () => {};

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    
    this.state = {
      playerPosition: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
      monsters: [],
      lastSpawnTime: 0,
      lastUpdateTime: Date.now(),
      isRunning: false,
    };

    this.setupCanvas();
    console.log("GameEngine initialized");
  }

  private setupCanvas(): void {
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;
    
    // Set CSS size for responsive display
    this.canvas.style.width = "100%";
    this.canvas.style.height = "auto";
    this.canvas.style.maxWidth = `${CANVAS_WIDTH}px`;
    this.canvas.style.maxHeight = `${CANVAS_HEIGHT}px`;
  }

  setCallbacks(callbacks: {
    onMonsterReachPlayer?: (damage: number) => void;
    onMonsterDestroyed?: (monsterId: string) => void;
    onStateUpdate?: (state: GameEngineState) => void;
  }): void {
    if (callbacks.onMonsterReachPlayer) {
      this.onMonsterReachPlayer = callbacks.onMonsterReachPlayer;
    }
    if (callbacks.onMonsterDestroyed) {
      this.onMonsterDestroyed = callbacks.onMonsterDestroyed;
    }
    if (callbacks.onStateUpdate) {
      this.onStateUpdate = callbacks.onStateUpdate;
    }
  }

  start(): void {
    console.log("GameEngine starting...");
    this.state.isRunning = true;
    this.state.lastUpdateTime = Date.now();
    this.gameLoop();
  }

  pause(): void {
    console.log("GameEngine pausing...");
    this.state.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  stop(): void {
    console.log("GameEngine stopping...");
    this.state.isRunning = false;
    this.state.monsters = [];
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  destroy(): void {
    this.stop();
  }

  getState(): GameEngineState {
    return this.state;
  }

  private gameLoop = (): void => {
    if (!this.state.isRunning) return;

    const currentTime = Date.now();
    const deltaTime = Math.min(currentTime - this.state.lastUpdateTime, 16.67); // Cap at 60fps
    this.state.lastUpdateTime = currentTime;

    try {
      this.update(deltaTime);
      this.render();
    } catch (error) {
      console.error("GameEngine loop error:", error);
    }

    this.animationId = requestAnimationFrame(this.gameLoop);
  };

  private update(deltaTime: number): void {
    // Update monsters (including those being destroyed for animation)
    this.state.monsters.forEach(monster => {
      // Only update movement if not being destroyed
      if (!monster.data.isDestroying) {
        monster.update(deltaTime, this.state.playerPosition);
        
        // Check if monster reached player
        if (monster.isAttacking(this.state.playerPosition, PLAYER_RADIUS)) {
          const damage = getMonsterDamage(monster.data.type);
          this.onMonsterReachPlayer(damage);
          this.destroyMonster(monster.data.id, false); // No animation when reaching player
        }
      }
    });
  }

  private render(): void {
    // Clear canvas with background
    this.ctx.fillStyle = "#1a1a2e";
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw grid background
    this.drawGrid();

    // Draw player (always visible)
    this.drawPlayer();

    // Draw all monsters (including those being destroyed for animation)
    this.state.monsters.forEach(monster => {
      try {
        monster.render(this.ctx);
      } catch (error) {
        console.warn("Error rendering monster:", error);
      }
    });

    // Draw UI overlay
    this.drawOverlay();
  }

  private drawGrid(): void {
    const gridSize = 50;
    this.ctx.strokeStyle = "#2a2a3e";
    this.ctx.lineWidth = 1;

    // Vertical lines
    for (let x = 0; x <= CANVAS_WIDTH; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, CANVAS_HEIGHT);
      this.ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y <= CANVAS_HEIGHT; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(CANVAS_WIDTH, y);
      this.ctx.stroke();
    }
  }

  private drawPlayer(): void {
    const { x, y } = this.state.playerPosition;
    
    this.ctx.save();
    
    // Player outer glow
    this.ctx.shadowColor = "#60a5fa";
    this.ctx.shadowBlur = 20;
    this.ctx.fillStyle = "#3b82f6";
    this.ctx.beginPath();
    this.ctx.arc(x, y, PLAYER_RADIUS, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;

    // Player main body with gradient effect
    const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, PLAYER_RADIUS);
    gradient.addColorStop(0, "#60a5fa");
    gradient.addColorStop(0.7, "#3b82f6");
    gradient.addColorStop(1, "#1d4ed8");
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(x, y, PLAYER_RADIUS, 0, Math.PI * 2);
    this.ctx.fill();

    // Player border
    this.ctx.strokeStyle = "#1e40af";
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(x, y, PLAYER_RADIUS, 0, Math.PI * 2);
    this.ctx.stroke();

    // Player symbol (brain/math symbol)
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = "bold 16px Arial";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText("🧠", x, y);
    
    this.ctx.restore();
  }

  private drawOverlay(): void {
    // Draw danger zone indicator
    const dangerDistance = 100;
    this.ctx.strokeStyle = "#ff4444";
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    this.ctx.beginPath();
    this.ctx.arc(
      this.state.playerPosition.x, 
      this.state.playerPosition.y, 
      dangerDistance, 
      0, 
      Math.PI * 2
    );
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  spawnMonster(wave: number, difficulty: "easy" | "medium" | "hard", equation?: string, answer?: number): void {
    const monsterData = createMonster(wave, difficulty);
    if (equation && answer !== undefined) {
      monsterData.equation = equation;
      monsterData.answer = answer;
      console.log("Monster spawned with equation:", equation, "answer:", answer);
    }
    const monster = new MonsterClass(monsterData);
    this.state.monsters.push(monster);
    
    // Notify game state immediately
    this.onStateUpdate(this.state);
  }

  spawnNextMonster(wave: number, difficulty: "easy" | "medium" | "hard", equation?: string, answer?: number): void {
    // Allow up to 3 monsters with staggered spawning
    if (this.state.monsters.length < 3) {
      const currentTime = Date.now();
      const timeSinceLastSpawn = currentTime - this.state.lastSpawnTime;
      
      // Enforce minimum 2-second gap between spawns
      if (timeSinceLastSpawn >= 2000) {
        this.spawnMonster(wave, difficulty, equation, answer);
        this.state.lastSpawnTime = currentTime;
      }
    }
  }

  spawnWave(wave: number, difficulty: "easy" | "medium" | "hard"): void {
    // This method is now deprecated in favor of sequential spawning
    if (this.state.monsters.length === 0) {
      this.spawnMonster(wave, difficulty);
    }
  }

  destroyMonster(monsterId: string, withAnimation: boolean = true): void {
    const monsterIndex = this.state.monsters.findIndex(m => m.data.id === monsterId);
    if (monsterIndex !== -1) {
      const monster = this.state.monsters[monsterIndex];
      
      if (withAnimation && !monster.data.isDestroying) {
        // Start destruction animation
        monster.data.isDestroying = true;
        monster.data.destructionStartTime = Date.now();
        
        // Continue rendering during animation but remove from state after animation
        setTimeout(() => {
          const currentIndex = this.state.monsters.findIndex(m => m.data.id === monsterId);
          if (currentIndex !== -1) {
            this.state.monsters.splice(currentIndex, 1);
            console.log("Monster removed from engine after animation:", monsterId);
          }
          this.onMonsterDestroyed(monsterId);
        }, 800); // 800ms animation duration to match Monster.ts
      } else {
        // Immediate removal without animation
        this.state.monsters.splice(monsterIndex, 1);
        console.log("Monster removed from engine immediately:", monsterId);
        this.onMonsterDestroyed(monsterId);
      }
    }
  }

  damageMonster(monsterId: string, damage: number): boolean {
    const monster = this.state.monsters.find(m => m.data.id === monsterId);
    if (monster) {
      const isDestroyed = monster.takeDamage(damage);
      if (isDestroyed) {
        this.destroyMonster(monsterId, true);
      }
      return isDestroyed;
    }
    return false;
  }
}