import { hash, compare } from "bcrypt";
import { randomBytes } from "crypto";

// Types
export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  stats: UserStats;
  settings?: UserSettings;
  createdAt: string;
  updatedAt: string;
}

export interface UserStats {
  totalGames: number;
  totalScore: number;
  bestScore: number;
  bestWave: number;
  averageAccuracy: number;
  totalPlayTime: number;
}

export interface UserSettings {
  language?: string;
  audioEnabled?: boolean;
  reducedMotion?: boolean;
  notifications?: boolean;
}

export interface InsertUser {
  username: string;
  email: string;
  password: string;
  stats: UserStats;
}

export interface GuestSession {
  id: string;
  fingerprint: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  expiresAt: string;
  pendingScores: string[];
}

export interface Question {
  id: string;
  text: string;
  answer: number;
  difficulty: "easy" | "medium" | "hard";
  type: string;
  createdAt: string;
  expiresAt: string;
}

export interface Score {
  id: string;
  userId?: string;
  guestSessionId?: string;
  score: number;
  wave: number;
  accuracy: number;
  difficulty: "easy" | "medium" | "hard";
  mode: string;
  timeElapsed: number;
  correctAnswers: number;
  totalQuestions: number;
  maxCombo: number;
  timestamp: string;
  status: "verified" | "pending" | "rejected";
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: "coins" | "gems";
  category: "powerup" | "cosmetic" | "boost";
  icon: string;
}

export interface UserCurrency {
  coins: number;
  gems: number;
}

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  verifyPassword(userId: string, password: string): Promise<boolean>;
  updateUserSettings(userId: string, settings: UserSettings): Promise<void>;
  deleteUser(userId: string): Promise<void>;
  exportUserData(userId: string): Promise<any>;

  // Guest session methods
  createGuestSession(data: { fingerprint: string; ipAddress: string; userAgent: string }): Promise<GuestSession>;
  getGuestSession(id: string): Promise<GuestSession | undefined>;
  mergeGuestSession(guestSessionId: string, userId: string): Promise<boolean>;
  getGuestSessionScores(guestSessionId: string): Promise<Score[] | undefined>;

  // Question methods
  generateQuestion(difficulty: "easy" | "medium" | "hard", wave: number): Promise<Question>;
  validateAnswer(questionId: string, answer: number): Promise<{ correct: boolean; difficulty: "easy" | "medium" | "hard"; correctAnswer?: number } | null>;

  // Score methods
  saveScore(score: Partial<Score>): Promise<Score>;
  getUserStats(userId: string): Promise<UserStats>;
  getUserGames(userId: string, limit: number): Promise<Score[]>;
  getLeaderboard(options: {
    timeframe: "all" | "today" | "week" | "month";
    difficulty: "all" | "easy" | "medium" | "hard";
    mode: "all" | string;
    limit: number;
  }): Promise<Array<Score & { rank: number; username: string }>>;

  // Shop methods
  getShopItems(userId?: string): Promise<Array<ShopItem & { owned: boolean }>>;
  purchaseItem(userId: string, itemId: string): Promise<{ success: boolean; message?: string }>;
  getUserCurrency(userId: string): Promise<UserCurrency>;
}

class QuestionGenerator {
  private questionCount = 0;

  generateQuestion(difficulty: "easy" | "medium" | "hard", wave: number): Question {
    this.questionCount++;
    const id = `q_${this.questionCount}_${Date.now()}`;
    
    const timeLimit = difficulty === "easy" ? 30000 : 
                     difficulty === "medium" ? 20000 : 15000;

    const effectiveDifficulty = this.adjustDifficultyForWave(difficulty, wave);
    const type = this.getRandomType(effectiveDifficulty);
    
    return this.createQuestion(id, type, effectiveDifficulty, timeLimit);
  }

  private adjustDifficultyForWave(baseDifficulty: string, wave: number): "easy" | "medium" | "hard" {
    if (wave <= 3) return "easy";
    if (wave <= 6) return baseDifficulty === "easy" ? "easy" : "medium";
    if (wave <= 10) return baseDifficulty === "easy" ? "medium" : "hard";
    return "hard";
  }

  private getRandomType(difficulty: "easy" | "medium" | "hard"): string {
    const types = {
      easy: ["addition", "subtraction"],
      medium: ["addition", "subtraction", "multiplication"],
      hard: ["addition", "subtraction", "multiplication", "division", "mixed"]
    };
    const availableTypes = types[difficulty];
    return availableTypes[Math.floor(Math.random() * availableTypes.length)];
  }

  private createQuestion(id: string, type: string, difficulty: "easy" | "medium" | "hard", timeLimit: number): Question {
    let text: string;
    let answer: number;

    switch (type) {
      case "addition":
        ({ text, answer } = this.generateAddition(difficulty));
        break;
      case "subtraction":
        ({ text, answer } = this.generateSubtraction(difficulty));
        break;
      case "multiplication":
        ({ text, answer } = this.generateMultiplication(difficulty));
        break;
      case "division":
        ({ text, answer } = this.generateDivision(difficulty));
        break;
      case "mixed":
        ({ text, answer } = this.generateMixed(difficulty));
        break;
      default:
        ({ text, answer } = this.generateAddition(difficulty));
    }

    return {
      id,
      text: text + " = ?",
      answer,
      difficulty,
      type,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + timeLimit).toISOString()
    };
  }

  private generateAddition(difficulty: "easy" | "medium" | "hard"): { text: string; answer: number } {
    let a: number, b: number;
    
    switch (difficulty) {
      case "easy":
        a = Math.floor(Math.random() * 20) + 1;
        b = Math.floor(Math.random() * 20) + 1;
        break;
      case "medium":
        a = Math.floor(Math.random() * 50) + 10;
        b = Math.floor(Math.random() * 50) + 10;
        break;
      case "hard":
        a = Math.floor(Math.random() * 100) + 20;
        b = Math.floor(Math.random() * 100) + 20;
        break;
    }
    
    return { text: `${a} + ${b}`, answer: a + b };
  }

  private generateSubtraction(difficulty: "easy" | "medium" | "hard"): { text: string; answer: number } {
    let a: number, b: number;
    
    switch (difficulty) {
      case "easy":
        a = Math.floor(Math.random() * 20) + 10;
        b = Math.floor(Math.random() * 10) + 1;
        break;
      case "medium":
        a = Math.floor(Math.random() * 50) + 25;
        b = Math.floor(Math.random() * 25) + 5;
        break;
      case "hard":
        a = Math.floor(Math.random() * 100) + 50;
        b = Math.floor(Math.random() * 50) + 10;
        break;
    }
    
    if (b > a) [a, b] = [b, a];
    return { text: `${a} - ${b}`, answer: a - b };
  }

  private generateMultiplication(difficulty: "easy" | "medium" | "hard"): { text: string; answer: number } {
    let a: number, b: number;
    
    switch (difficulty) {
      case "easy":
        a = Math.floor(Math.random() * 5) + 2;
        b = Math.floor(Math.random() * 5) + 2;
        break;
      case "medium":
        a = Math.floor(Math.random() * 8) + 3;
        b = Math.floor(Math.random() * 8) + 3;
        break;
      case "hard":
        a = Math.floor(Math.random() * 10) + 5;
        b = Math.floor(Math.random() * 10) + 5;
        break;
    }
    
    return { text: `${a} × ${b}`, answer: a * b };
  }

  private generateDivision(difficulty: "easy" | "medium" | "hard"): { text: string; answer: number } {
    let divisor: number, quotient: number;
    
    switch (difficulty) {
      case "easy":
        divisor = Math.floor(Math.random() * 5) + 2;
        quotient = Math.floor(Math.random() * 10) + 1;
        break;
      case "medium":
        divisor = Math.floor(Math.random() * 8) + 2;
        quotient = Math.floor(Math.random() * 15) + 2;
        break;
      case "hard":
        divisor = Math.floor(Math.random() * 10) + 3;
        quotient = Math.floor(Math.random() * 20) + 5;
        break;
    }
    
    const dividend = divisor * quotient;
    return { text: `${dividend} ÷ ${divisor}`, answer: quotient };
  }

  private generateMixed(difficulty: "easy" | "medium" | "hard"): { text: string; answer: number } {
    const operations = ["+", "-", "×"];
    const op1 = operations[Math.floor(Math.random() * operations.length)];
    const op2 = operations[Math.floor(Math.random() * operations.length)];
    
    let a: number, b: number, c: number;
    
    switch (difficulty) {
      case "easy":
        a = Math.floor(Math.random() * 10) + 1;
        b = Math.floor(Math.random() * 10) + 1;
        c = Math.floor(Math.random() * 10) + 1;
        break;
      case "medium":
        a = Math.floor(Math.random() * 15) + 2;
        b = Math.floor(Math.random() * 15) + 2;
        c = Math.floor(Math.random() * 15) + 2;
        break;
      case "hard":
        a = Math.floor(Math.random() * 20) + 5;
        b = Math.floor(Math.random() * 20) + 5;
        c = Math.floor(Math.random() * 20) + 5;
        break;
    }
    
    // Calculate result following order of operations
    let result: number;
    let questionText: string;
    
    if (op1 === "×" || op2 === "×") {
      if (op1 === "×") {
        const temp = a * b;
        result = op2 === "+" ? temp + c : temp - c;
        questionText = `${a} × ${b} ${op2} ${c}`;
      } else {
        const temp = b * c;
        result = op1 === "+" ? a + temp : a - temp;
        questionText = `${a} ${op1} ${b} × ${c}`;
      }
    } else {
      const temp = op1 === "+" ? a + b : a - b;
      result = op2 === "+" ? temp + c : temp - c;
      questionText = `${a} ${op1} ${b} ${op2} ${c}`;
    }
    
    // Ensure positive result
    if (result < 0) {
      return this.generateAddition(difficulty);
    }
    
    return { text: questionText, answer: result };
  }
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private guestSessions: Map<string, GuestSession> = new Map();
  private questions: Map<string, Question> = new Map();
  private scores: Map<string, Score> = new Map();
  private userPurchases: Map<string, Set<string>> = new Map();
  private userCurrencies: Map<string, UserCurrency> = new Map();
  
  private questionGenerator = new QuestionGenerator();
  private currentId = 1;

  private generateId(): string {
    return `id_${this.currentId++}_${Date.now()}`;
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.generateId();
    const passwordHash = await hash(insertUser.password, 10);
    
    const user: User = {
      id,
      username: insertUser.username,
      email: insertUser.email,
      passwordHash,
      stats: insertUser.stats,
      settings: {
        language: "en",
        audioEnabled: true,
        reducedMotion: false,
        notifications: true
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.users.set(id, user);
    this.userCurrencies.set(id, { coins: 100, gems: 0 }); // Starting currency
    this.userPurchases.set(id, new Set());
    
    return user;
  }

  async verifyPassword(userId: string, password: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;
    return await compare(password, user.passwordHash);
  }

  async updateUserSettings(userId: string, settings: UserSettings): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.settings = { ...user.settings, ...settings };
      user.updatedAt = new Date().toISOString();
    }
  }

  async deleteUser(userId: string): Promise<void> {
    this.users.delete(userId);
    this.userCurrencies.delete(userId);
    this.userPurchases.delete(userId);
    
    // Delete user's scores
    for (const [scoreId, score] of this.scores.entries()) {
      if (score.userId === userId) {
        this.scores.delete(scoreId);
      }
    }
  }

  async exportUserData(userId: string): Promise<any> {
    const user = this.users.get(userId);
    if (!user) return null;

    const userScores = Array.from(this.scores.values()).filter(score => score.userId === userId);
    const currency = this.userCurrencies.get(userId);
    const purchases = Array.from(this.userPurchases.get(userId) || []);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        stats: user.stats,
        settings: user.settings,
        createdAt: user.createdAt
      },
      scores: userScores,
      currency,
      purchases,
      exportedAt: new Date().toISOString()
    };
  }

  // Guest session methods
  async createGuestSession(data: { fingerprint: string; ipAddress: string; userAgent: string }): Promise<GuestSession> {
    const id = `guest_${this.generateId()}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
    
    const guestSession: GuestSession = {
      id,
      fingerprint: data.fingerprint,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      createdAt: new Date().toISOString(),
      expiresAt,
      pendingScores: []
    };

    this.guestSessions.set(id, guestSession);
    return guestSession;
  }

  async getGuestSession(id: string): Promise<GuestSession | undefined> {
    const session = this.guestSessions.get(id);
    if (session && new Date(session.expiresAt) < new Date()) {
      this.guestSessions.delete(id);
      return undefined;
    }
    return session;
  }

  async mergeGuestSession(guestSessionId: string, userId: string): Promise<boolean> {
    const guestSession = this.guestSessions.get(guestSessionId);
    if (!guestSession) return false;

    const user = this.users.get(userId);
    if (!user) return false;

    // Move pending scores to verified status
    let mergedCount = 0;
    for (const [scoreId, score] of this.scores.entries()) {
      if (score.guestSessionId === guestSessionId && score.status === "pending") {
        score.userId = userId;
        score.guestSessionId = undefined;
        score.status = "verified";
        mergedCount++;
      }
    }

    // Update user stats
    if (mergedCount > 0) {
      const userScores = Array.from(this.scores.values()).filter(s => s.userId === userId);
      user.stats = this.calculateUserStats(userScores);
      user.updatedAt = new Date().toISOString();
    }

    // Clean up guest session
    this.guestSessions.delete(guestSessionId);
    return true;
  }

  async getGuestSessionScores(guestSessionId: string): Promise<Score[] | undefined> {
    return Array.from(this.scores.values()).filter(score => 
      score.guestSessionId === guestSessionId && score.status === "pending"
    );
  }

  // Question methods
  async generateQuestion(difficulty: "easy" | "medium" | "hard", wave: number): Promise<Question> {
    const question = this.questionGenerator.generateQuestion(difficulty, wave);
    this.questions.set(question.id, question);
    
    // Clean up expired questions
    const now = new Date();
    for (const [id, q] of this.questions.entries()) {
      if (new Date(q.expiresAt) < now) {
        this.questions.delete(id);
      }
    }
    
    return question;
  }

  async validateAnswer(questionId: string, answer: number): Promise<{ correct: boolean; difficulty: "easy" | "medium" | "hard"; correctAnswer?: number } | null> {
    const question = this.questions.get(questionId);
    if (!question || new Date(question.expiresAt) < new Date()) {
      return null;
    }

    const correct = question.answer === answer;
    return {
      correct,
      difficulty: question.difficulty,
      correctAnswer: correct ? undefined : question.answer
    };
  }

  // Score methods
  async saveScore(scoreData: Partial<Score>): Promise<Score> {
    const id = this.generateId();
    const score: Score = {
      id,
      userId: scoreData.userId,
      guestSessionId: scoreData.guestSessionId,
      score: scoreData.score || 0,
      wave: scoreData.wave || 1,
      accuracy: scoreData.accuracy || 0,
      difficulty: scoreData.difficulty || "easy",
      mode: scoreData.mode || "classic",
      timeElapsed: scoreData.timeElapsed || 0,
      correctAnswers: scoreData.correctAnswers || 0,
      totalQuestions: scoreData.totalQuestions || 0,
      maxCombo: scoreData.maxCombo || 0,
      timestamp: scoreData.timestamp || new Date().toISOString(),
      status: scoreData.status || "verified"
    };

    this.scores.set(id, score);

    // Update user stats if verified
    if (score.userId && score.status === "verified") {
      await this.updateUserStatsFromScore(score.userId, score);
    }

    return score;
  }

  private async updateUserStatsFromScore(userId: string, score: Score): Promise<void> {
    const user = this.users.get(userId);
    if (!user) return;

    const userScores = Array.from(this.scores.values()).filter(s => 
      s.userId === userId && s.status === "verified"
    );
    
    user.stats = this.calculateUserStats(userScores);
    user.updatedAt = new Date().toISOString();

    // Award currency for playing
    const currency = this.userCurrencies.get(userId) || { coins: 0, gems: 0 };
    const coinReward = 50 + Math.floor(score.accuracy / 10); // Base 50 + accuracy bonus
    currency.coins += coinReward;

    // Gem rewards for excellent performance
    if (score.accuracy >= 90 && score.wave >= 5) {
      currency.gems += 1;
    }

    this.userCurrencies.set(userId, currency);
  }

  private calculateUserStats(scores: Score[]): UserStats {
    if (scores.length === 0) {
      return {
        totalGames: 0,
        totalScore: 0,
        bestScore: 0,
        bestWave: 0,
        averageAccuracy: 0,
        totalPlayTime: 0
      };
    }

    return {
      totalGames: scores.length,
      totalScore: scores.reduce((sum, s) => sum + s.score, 0),
      bestScore: Math.max(...scores.map(s => s.score)),
      bestWave: Math.max(...scores.map(s => s.wave)),
      averageAccuracy: scores.reduce((sum, s) => sum + s.accuracy, 0) / scores.length,
      totalPlayTime: scores.reduce((sum, s) => sum + s.timeElapsed, 0)
    };
  }

  async getUserStats(userId: string): Promise<UserStats> {
    const user = this.users.get(userId);
    return user?.stats || {
      totalGames: 0,
      totalScore: 0,
      bestScore: 0,
      bestWave: 0,
      averageAccuracy: 0,
      totalPlayTime: 0
    };
  }

  async getUserGames(userId: string, limit: number): Promise<Score[]> {
    const userScores = Array.from(this.scores.values())
      .filter(score => score.userId === userId && score.status === "verified")
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
    
    return userScores;
  }

  async getLeaderboard(options: {
    timeframe: "all" | "today" | "week" | "month";
    difficulty: "all" | "easy" | "medium" | "hard";
    mode: "all" | string;
    limit: number;
  }): Promise<Array<Score & { rank: number; username: string }>> {
    let filteredScores = Array.from(this.scores.values())
      .filter(score => score.userId && score.status === "verified");

    // Apply timeframe filter
    if (options.timeframe !== "all") {
      const now = new Date();
      const timeThreshold = new Date();
      
      switch (options.timeframe) {
        case "today":
          timeThreshold.setHours(0, 0, 0, 0);
          break;
        case "week":
          timeThreshold.setDate(now.getDate() - 7);
          break;
        case "month":
          timeThreshold.setMonth(now.getMonth() - 1);
          break;
      }
      
      filteredScores = filteredScores.filter(score => 
        new Date(score.timestamp) >= timeThreshold
      );
    }

    // Apply difficulty filter
    if (options.difficulty !== "all") {
      filteredScores = filteredScores.filter(score => score.difficulty === options.difficulty);
    }

    // Apply mode filter
    if (options.mode !== "all") {
      filteredScores = filteredScores.filter(score => score.mode === options.mode);
    }

    // Sort by score and take top scores
    const topScores = filteredScores
      .sort((a, b) => b.score - a.score)
      .slice(0, options.limit);

    // Add rank and username
    const leaderboard = topScores.map((score, index) => {
      const user = this.users.get(score.userId!);
      return {
        ...score,
        rank: index + 1,
        username: user?.username || "Unknown"
      };
    });

    return leaderboard;
  }

  // Shop methods
  async getShopItems(userId?: string): Promise<Array<ShopItem & { owned: boolean }>> {
    const baseItems: ShopItem[] = [
      {
        id: "freeze_upgrade",
        name: "Enhanced Freeze",
        description: "Freeze lasts 5 seconds instead of 3",
        price: 500,
        currency: "coins",
        category: "powerup",
        icon: "❄️"
      },
      {
        id: "shield_upgrade", 
        name: "Reinforced Shield",
        description: "Shield blocks 5 hits instead of 3",
        price: 750,
        currency: "coins",
        category: "powerup",
        icon: "🛡️"
      },
      {
        id: "player_red",
        name: "Red Player",
        description: "Change your player color to red",
        price: 200,
        currency: "coins",
        category: "cosmetic",
        icon: "🔴"
      },
      {
        id: "double_coins",
        name: "Double Coins",
        description: "Earn 2x coins for the next 5 games",
        price: 100,
        currency: "coins",
        category: "boost",
        icon: "💰"
      }
    ];

    const userPurchases = userId ? this.userPurchases.get(userId) : new Set();
    
    return baseItems.map(item => ({
      ...item,
      owned: userPurchases?.has(item.id) || false
    }));
  }

  async purchaseItem(userId: string, itemId: string): Promise<{ success: boolean; message?: string }> {
    const user = this.users.get(userId);
    if (!user) {
      return { success: false, message: "User not found" };
    }

    const items = await this.getShopItems(userId);
    const item = items.find(i => i.id === itemId);
    
    if (!item) {
      return { success: false, message: "Item not found" };
    }

    if (item.owned) {
      return { success: false, message: "Item already owned" };
    }

    const currency = this.userCurrencies.get(userId) || { coins: 0, gems: 0 };
    const requiredAmount = item.price;
    const userAmount = item.currency === "coins" ? currency.coins : currency.gems;

    if (userAmount < requiredAmount) {
      return { success: false, message: `Not enough ${item.currency}` };
    }

    // Deduct currency
    if (item.currency === "coins") {
      currency.coins -= item.price;
    } else {
      currency.gems -= item.price;
    }
    this.userCurrencies.set(userId, currency);

    // Add to purchases
    const purchases = this.userPurchases.get(userId) || new Set();
    purchases.add(itemId);
    this.userPurchases.set(userId, purchases);

    return { success: true };
  }

  async getUserCurrency(userId: string): Promise<UserCurrency> {
    return this.userCurrencies.get(userId) || { coins: 0, gems: 0 };
  }
}

export const storage = new MemStorage();
