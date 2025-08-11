import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export interface Question {
  id: string;
  text: string;
  answer: number;
  difficulty: "easy" | "medium" | "hard";
  timeLimit: number;
}

export interface Monster {
  id: string;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  speed: number;
  targetX: number;
  targetY: number;
  type: "basic" | "fast" | "tank" | "boss";
  color: string;
  size: number;
  equation?: string;
  answer?: number;
  isDestroying?: boolean;
  destructionStartTime?: number;
  spawnX?: number;
  spawnY?: number;
}

export interface PowerUp {
  id: string;
  type: "freeze" | "multiply" | "heal" | "shield";
  name: string;
  description: string;
  active: boolean;
  duration: number;
  cooldown: number;
  lastUsed: number;
}

export type GamePhase = "menu" | "playing" | "paused" | "gameOver" | "tutorial";

interface GameState {
  // Game state
  phase: GamePhase;
  score: number;
  health: number;
  maxHealth: number;
  wave: number;
  combo: number;
  maxCombo: number;

  // Game objects
  currentQuestion: Question | null;
  monsters: Monster[];
  powerUps: PowerUp[];
  isSpawningMonster: boolean;
  lastSpawnTime: number;

  // Statistics
  questionsAnswered: number;
  correctAnswers: number;
  wrongAnswers: number;
  timeElapsed: number;

  // Settings
  difficulty: "easy" | "medium" | "hard";
  timeLimit: number;

  // Actions
  setPhase: (phase: GamePhase) => void;
  setCurrentQuestion: (question: Question | null) => void;
  answerQuestion: (answer: number) => boolean;
  addMonster: (monster: Monster) => void;
  removeMonster: (id: string) => void;
  updateMonster: (id: string, updates: Partial<Monster>) => void;
  takeDamage: (amount: number) => void;
  heal: (amount: number) => void;
  addScore: (points: number) => void;
  usePowerUp: (type: string) => void;
  nextWave: () => void;
  resetGame: () => void;
  updateTimeElapsed: (time: number) => void;
  setDifficulty: (difficulty: "easy" | "medium" | "hard") => void;
  canSpawnMonster: () => boolean;
  setIsSpawningMonster: (isSpawning: boolean) => void;
  setLastSpawnTime: (time: number) => void;
}

const initialPowerUps: PowerUp[] = [
  {
    id: "freeze",
    type: "freeze",
    name: "Ice Freeze",
    description: "Freezes all monsters for 3 seconds",
    active: false,
    duration: 3000,
    cooldown: 15000,
    lastUsed: 0,
  },
  {
    id: "multiply",
    type: "multiply",
    name: "Score Boost",
    description: "Doubles score for 10 seconds",
    active: false,
    duration: 10000,
    cooldown: 30000,
    lastUsed: 0,
  },
  {
    id: "heal",
    type: "heal",
    name: "Health Potion",
    description: "Restores 2 health points",
    active: false,
    duration: 0,
    cooldown: 20000,
    lastUsed: 0,
  },
  {
    id: "shield",
    type: "shield",
    name: "Magic Shield",
    description: "Blocks next 3 damage instances",
    active: false,
    duration: 30000,
    cooldown: 45000,
    lastUsed: 0,
  },
];

export const useGameState = create<GameState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    phase: "menu",
    score: 0,
    health: 5,
    maxHealth: 5,
    wave: 1,
    combo: 0,
    maxCombo: 0,

    currentQuestion: null,
    monsters: [],
    powerUps: [...initialPowerUps],
    isSpawningMonster: false,
    lastSpawnTime: 0,

    questionsAnswered: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    timeElapsed: 0,

    difficulty: "easy",
    timeLimit: 30000, // 30 seconds

    // Actions
    setPhase: (phase) => set({ phase }),

    setCurrentQuestion: (question) => set({ currentQuestion: question }),

    answerQuestion: (answer) => {
      const { currentQuestion, combo, score } = get();
      if (!currentQuestion) return false;

      const isCorrect = answer === currentQuestion.answer;
      const newCombo = isCorrect ? combo + 1 : 0;
      const comboMultiplier = Math.floor(newCombo / 5) + 1; // +1 multiplier every 5 combo
      const basePoints = currentQuestion.difficulty === "easy" ? 10 : 
                        currentQuestion.difficulty === "medium" ? 20 : 30;
      const points = isCorrect ? basePoints * comboMultiplier : 0;

      set((state) => ({
        questionsAnswered: state.questionsAnswered + 1,
        correctAnswers: isCorrect ? state.correctAnswers + 1 : state.correctAnswers,
        wrongAnswers: isCorrect ? state.wrongAnswers : state.wrongAnswers + 1,
        combo: newCombo,
        maxCombo: Math.max(state.maxCombo, newCombo),
        score: state.score + points,
        // Keep currentQuestion intact - don't set to null
      }));

      return isCorrect;
    },

    addMonster: (monster) => set((state) => ({
      monsters: [...state.monsters, monster],
      isSpawningMonster: false, // Reset flag after spawning
    })),

    removeMonster: (id) => set((state) => {
      console.log("Removing monster from state:", id);
      return {
        monsters: state.monsters.filter(m => m.id !== id)
      };
    }),

    updateMonster: (id, updates) => set((state) => ({
      monsters: state.monsters.map(m => m.id === id ? { ...m, ...updates } : m)
    })),

    takeDamage: (amount) => set((state) => {
      const newHealth = Math.max(0, state.health - amount);
      return {
        health: newHealth,
        combo: 0, // Reset combo on damage
        phase: newHealth <= 0 ? "gameOver" : state.phase,
      };
    }),

    heal: (amount) => set((state) => ({
      health: Math.min(state.maxHealth, state.health + amount)
    })),

    addScore: (points) => set((state) => ({
      score: state.score + points
    })),

    usePowerUp: (type) => {
      const now = Date.now();
      set((state) => ({
        powerUps: state.powerUps.map(p => 
          p.type === type && now - p.lastUsed >= p.cooldown
            ? { ...p, active: true, lastUsed: now }
            : p
        )
      }));

      // Apply power-up effects
      const powerUp = get().powerUps.find(p => p.type === type);
      if (powerUp?.type === "heal") {
        get().heal(2);
      }
    },

    nextWave: () => set((state) => ({
      wave: state.wave + 1,
      monsters: [], // Clear current monsters
    })),

    resetGame: () => set({
      phase: "menu",
      score: 0,
      health: 5,
      wave: 1,
      combo: 0,
      maxCombo: 0,
      currentQuestion: null,
      monsters: [],
      powerUps: [...initialPowerUps],
      questionsAnswered: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      timeElapsed: 0,
      isSpawningMonster: false,
      lastSpawnTime: 0,
    }),

    updateTimeElapsed: (time) => set({ timeElapsed: time }),

    setDifficulty: (difficulty) => {
      const timeLimit = difficulty === "easy" ? 30000 : 
                      difficulty === "medium" ? 20000 : 15000;
      set({ difficulty, timeLimit });
    },

    canSpawnMonster: () => {
      const { monsters, isSpawningMonster, lastSpawnTime } = get();
      const now = Date.now();
      const timeSinceLastSpawn = now - lastSpawnTime;
      const minSpawnInterval = 5000; // 5 seconds minimum as requested

      // Only count non-destroying monsters for spawn limit
      const activeMonsters = monsters.filter(m => !m.isDestroying);
      
      return activeMonsters.length < 3 && // Allow up to 3 active monsters max
             !isSpawningMonster && 
             timeSinceLastSpawn >= minSpawnInterval;
    },

    setIsSpawningMonster: (isSpawning: boolean) => set({ isSpawningMonster: isSpawning }),
    setLastSpawnTime: (time: number) => set({ lastSpawnTime: time }),
  }))
);