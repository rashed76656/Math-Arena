import { Monster, PowerUp } from "./stores/useGameState";

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;
export const PLAYER_RADIUS = 30;

export interface Point {
  x: number;
  y: number;
}

// Monster spawning utilities
export function generateMonsterSpawnPoint(): Point {
  const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
  const margin = 250; // Fixed distance for precise 5-second timing
  
  switch (side) {
    case 0: // top
      return { x: Math.random() * CANVAS_WIDTH, y: -margin };
    case 1: // right
      return { x: CANVAS_WIDTH + margin, y: Math.random() * CANVAS_HEIGHT };
    case 2: // bottom
      return { x: Math.random() * CANVAS_WIDTH, y: CANVAS_HEIGHT + margin };
    case 3: // left
      return { x: -margin, y: Math.random() * CANVAS_HEIGHT };
    default:
      return { x: -margin, y: Math.random() * CANVAS_HEIGHT };
  }
}

export function createMonster(wave: number, difficulty: "easy" | "medium" | "hard"): Monster {
  const spawnPoint = generateMonsterSpawnPoint();
  const playerCenter = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 };
  
  // Monster types based on wave progression
  const types: Monster["type"][] = ["basic"];
  if (wave >= 3) types.push("fast");
  if (wave >= 5) types.push("tank");
  if (wave % 10 === 0) types.push("boss"); // Boss every 10th wave
  
  const type = types[Math.floor(Math.random() * types.length)];
  
  let health: number, speed: number, size: number, color: string;
  
  // Calculate exact speed needed to reach player in exactly 5 seconds
  const spawnDistance = Math.sqrt(
    Math.pow(spawnPoint.x - playerCenter.x, 2) + 
    Math.pow(spawnPoint.y - playerCenter.y, 2)
  );
  
  // Speed calculation: pixels per millisecond to reach in exactly 5000ms
  const exactSpeed = spawnDistance / 5000; // pixels per millisecond

  switch (type) {
    case "fast":
      health = 1;
      speed = exactSpeed;
      size = 20;
      color = "#10b981"; // Green
      break;
    case "tank":
      health = 5;
      speed = exactSpeed * 0.9; // Slightly slower
      size = 40;
      color = "#dc2626"; // Red
      break;
    case "boss":
      health = 15;
      speed = exactSpeed * 0.8; // Even slower
      size = 60;
      color = "#7c3aed"; // Purple
      break;
    default: // basic
      health = 2;
      speed = exactSpeed;
      size = 25;
      color = "#f97316"; // Orange
  }
  
  // Don't scale speed with difficulty - we need exact 5 second timing
  // Only scale health with difficulty
  const healthMultiplier = difficulty === "easy" ? 0.8 : difficulty === "medium" ? 1.0 : 1.2;
  health = Math.ceil(health * healthMultiplier);
  
  return {
    id: `monster_${Date.now()}_${Math.random()}`,
    x: spawnPoint.x,
    y: spawnPoint.y,
    health,
    maxHealth: health,
    speed,
    targetX: playerCenter.x,
    targetY: playerCenter.y,
    type,
    color,
    size,
  };
}

export function calculateDistance(p1: Point, p2: Point): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function normalizeVector(vector: Point): Point {
  const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
  if (length === 0) return { x: 0, y: 0 };
  return { x: vector.x / length, y: vector.y / length };
}

export function moveTowardsTarget(
  current: Point, 
  target: Point, 
  speed: number, 
  deltaTime: number
): Point {
  const direction = {
    x: target.x - current.x,
    y: target.y - current.y,
  };
  
  const normalized = normalizeVector(direction);
  const moveDistance = speed * deltaTime; // speed is already in pixels per millisecond
  
  return {
    x: current.x + normalized.x * moveDistance,
    y: current.y + normalized.y * moveDistance,
  };
}

export function checkCircleCollision(
  pos1: Point, 
  radius1: number, 
  pos2: Point, 
  radius2: number
): boolean {
  const distance = calculateDistance(pos1, pos2);
  return distance < radius1 + radius2;
}

export function getWaveMonsterCount(wave: number): number {
  return Math.min(3 + Math.floor(wave / 2), 12); // Start with 3, increase by 1 every 2 waves, max 12
}

export function getWaveSpawnRate(wave: number): number {
  return Math.max(5000, 5000); // Always 5 seconds minimum as requested
}

export function formatTime(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function formatScore(score: number): string {
  if (score >= 1000000) {
    return `${(score / 1000000).toFixed(1)}M`;
  }
  if (score >= 1000) {
    return `${(score / 1000).toFixed(1)}K`;
  }
  return score.toString();
}

export function calculateAccuracy(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

export function isPlayerInDanger(monsters: Monster[]): boolean {
  const playerCenter = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 };
  const dangerDistance = 100;
  
  return monsters.some(monster => 
    calculateDistance(monster, playerCenter) < dangerDistance
  );
}

export function getPowerUpCooldownProgress(powerUp: PowerUp): number {
  const now = Date.now();
  const timeSinceUsed = now - powerUp.lastUsed;
  return Math.min(timeSinceUsed / powerUp.cooldown, 1);
}

// Score calculation utilities
export function calculateQuestionScore(
  difficulty: "easy" | "medium" | "hard",
  isCorrect: boolean,
  timeBonus: number,
  comboMultiplier: number
): number {
  if (!isCorrect) return 0;
  
  const baseScore = difficulty === "easy" ? 10 : difficulty === "medium" ? 20 : 30;
  const timeBonusScore = Math.floor(timeBonus * 5); // Up to 25 bonus points
  
  return Math.floor((baseScore + timeBonusScore) * comboMultiplier);
}

export function calculateTimeBonus(timeRemaining: number, timeLimit: number): number {
  return Math.max(0, timeRemaining / timeLimit); // 0 to 1 based on remaining time
}

export function getComboMultiplier(combo: number): number {
  return 1 + Math.floor(combo / 5) * 0.5; // +0.5x every 5 combo
}

// Game balance utilities
export function shouldSpawnBoss(wave: number): boolean {
  return wave > 0 && wave % 10 === 0;
}

export function getMaxMonsterHealth(wave: number, difficulty: "easy" | "medium" | "hard"): number {
  const baseHealth = difficulty === "easy" ? 2 : difficulty === "medium" ? 3 : 4;
  const waveMultiplier = 1 + Math.floor(wave / 5) * 0.5;
  return Math.ceil(baseHealth * waveMultiplier);
}

export function getMonsterDamage(monsterType: Monster["type"]): number {
  switch (monsterType) {
    case "fast": return 1;
    case "tank": return 2;
    case "boss": return 3;
    default: return 1; // basic
  }
}
