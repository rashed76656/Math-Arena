import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import { storage } from "./storage";
import { z } from "zod";

const MemoryStoreSession = MemoryStore(session);

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  username: z.string().min(3).max(20),
  guestSessionId: z.string().optional()
});

const guestSessionSchema = z.object({
  deviceFingerprint: z.string().optional(),
  clientNonce: z.string().optional()
});

const gameOverSchema = z.object({
  userId: z.string().optional(),
  guestSessionId: z.string().optional(),
  sessionId: z.string().optional(),
  stats: z.object({
    score: z.number(),
    correct: z.number(),
    wrong: z.number(),
    time: z.number(),
    maxCombo: z.number(),
    wave: z.number(),
    accuracy: z.number(),
    difficulty: z.enum(["easy", "medium", "hard"]),
    mode: z.string()
  }),
  eventsLogHash: z.string().optional()
});

const answerSchema = z.object({
  questionId: z.string(),
  answer: z.number(),
  clientTime: z.number(),
  token: z.string().optional(),
  guestSessionId: z.string().optional()
});

const createRoomSchema = z.object({
  name: z.string().min(1).max(50),
  mode: z.string(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  maxPlayers: z.number().min(2).max(8),
  isPrivate: z.boolean(),
  timeLimit: z.number().min(10).max(60),
  startingHealth: z.number().min(1).max(10),
  powerUpsEnabled: z.boolean()
});

const purchaseItemSchema = z.object({
  itemId: z.string()
});

// Middleware to check authentication
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
};

// Middleware to get user or guest session
const getUserOrGuest = async (req: any, res: any, next: any) => {
  if (req.session?.userId) {
    req.user = await storage.getUser(req.session.userId);
  } else if (req.headers['guest-session-id']) {
    req.guestSession = await storage.getGuestSession(req.headers['guest-session-id']);
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure session middleware
  app.use(session({
    store: new MemoryStoreSession({
      checkPeriod: 86400000 // Prune expired entries every 24h
    }),
    secret: process.env.SESSION_SECRET || "math-arena-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    }
  }));

  // Authentication routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, username, guestSessionId } = signupSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }

      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }

      // Create user
      const user = await storage.createUser({
        email,
        password,
        username,
        stats: {
          totalGames: 0,
          totalScore: 0,
          bestScore: 0,
          bestWave: 0,
          averageAccuracy: 0,
          totalPlayTime: 0
        }
      });

      // Set session
      req.session.userId = user.id;

      // Handle guest session merge if provided
      let merged = false;
      if (guestSessionId) {
        try {
          merged = await storage.mergeGuestSession(guestSessionId, user.id);
        } catch (error) {
          console.error("Failed to merge guest session:", error);
        }
      }

      res.json({ 
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          stats: user.stats
        },
        merged 
      });
    } catch (error) {
      console.error("Signup error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data" });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user || !await storage.verifyPassword(user.id, password)) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user.id;

      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          stats: user.stats
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data" });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ message: "Logged out successfully" });
    });
  });

  app.post("/api/auth/guest", async (req, res) => {
    try {
      const { deviceFingerprint } = guestSessionSchema.parse(req.body);
      
      const guestSession = await storage.createGuestSession({
        fingerprint: deviceFingerprint || "",
        ipAddress: req.ip || "",
        userAgent: req.get("User-Agent") || ""
      });

      res.json({
        guestSessionId: guestSession.id,
        expiresAt: guestSession.expiresAt
      });
    } catch (error) {
      console.error("Guest session error:", error);
      res.status(500).json({ message: "Failed to create guest session" });
    }
  });

  app.post("/api/auth/convert-guest", requireAuth, async (req, res) => {
    try {
      const { guestSessionId } = req.body;
      const userId = req.session.userId;
      
      const merged = await storage.mergeGuestSession(guestSessionId, userId);
      const mergedRecords = await storage.getGuestSessionScores(guestSessionId);
      
      res.json({
        merged,
        mergedRecords: mergedRecords || [],
        warnings: []
      });
    } catch (error) {
      console.error("Convert guest error:", error);
      res.status(500).json({ message: "Failed to convert guest session" });
    }
  });

  // Question generation route
  app.get("/api/question", getUserOrGuest, async (req, res) => {
    try {
      const mode = req.query.mode as string || "easy";
      const wave = parseInt(req.query.wave as string) || 1;
      
      const question = await storage.generateQuestion(mode as "easy" | "medium" | "hard", wave);
      
      res.json({
        id: question.id,
        text: question.text,
        difficulty: question.difficulty,
        expiresAt: new Date(Date.now() + 30000).toISOString()
      });
    } catch (error) {
      console.error("Question generation error:", error);
      res.status(500).json({ message: "Failed to generate question" });
    }
  });

  // Answer validation route
  app.post("/api/answer", getUserOrGuest, async (req, res) => {
    try {
      const { questionId, answer, clientTime, guestSessionId } = answerSchema.parse(req.body);
      
      const result = await storage.validateAnswer(questionId, answer);
      
      if (!result) {
        return res.status(404).json({ message: "Question not found or expired" });
      }

      // Calculate points based on correctness and timing
      let points = 0;
      let comboIncrement = 0;
      
      if (result.correct) {
        const basePoints = result.difficulty === "easy" ? 10 : 
                          result.difficulty === "medium" ? 20 : 30;
        const timeBonus = Math.max(0, (30000 - (Date.now() - clientTime)) / 30000);
        points = Math.floor(basePoints + (basePoints * timeBonus * 0.5));
        comboIncrement = 1;
      }

      res.json({
        correct: result.correct,
        points,
        comboIncrement,
        correctAnswer: result.correct ? undefined : result.correctAnswer
      });
    } catch (error) {
      console.error("Answer validation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid answer data" });
      }
      res.status(500).json({ message: "Failed to validate answer" });
    }
  });

  // Game over route
  app.post("/api/game-over", getUserOrGuest, async (req, res) => {
    try {
      const gameData = gameOverSchema.parse(req.body);
      
      const scoreRecord = {
        userId: req.session?.userId,
        guestSessionId: gameData.guestSessionId,
        score: gameData.stats.score,
        wave: gameData.stats.wave,
        accuracy: gameData.stats.accuracy,
        difficulty: gameData.stats.difficulty,
        mode: gameData.stats.mode,
        timeElapsed: gameData.stats.time,
        correctAnswers: gameData.stats.correct,
        totalQuestions: gameData.stats.correct + gameData.stats.wrong,
        maxCombo: gameData.stats.maxCombo,
        timestamp: new Date().toISOString()
      };

      if (req.session?.userId) {
        // Authenticated user - save immediately
        await storage.saveScore(scoreRecord);
        res.json({ saved: true, status: "verified" });
      } else if (gameData.guestSessionId) {
        // Guest user - save as pending
        await storage.saveScore({ ...scoreRecord, status: "pending" });
        res.json({ saved: true, status: "pending" });
      } else {
        res.status(400).json({ message: "No user or guest session provided" });
      }
    } catch (error) {
      console.error("Game over error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid game data" });
      }
      res.status(500).json({ message: "Failed to save game result" });
    }
  });

  // Leaderboard routes
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const timeframe = req.query.timeframe as string || "all";
      const difficulty = req.query.difficulty as string || "all";
      const mode = req.query.mode as string || "all";
      const limit = parseInt(req.query.limit as string) || 50;

      const entries = await storage.getLeaderboard({
        timeframe: timeframe as any,
        difficulty: difficulty as any,
        mode: mode as any,
        limit
      });

      res.json({ entries });
    } catch (error) {
      console.error("Leaderboard error:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // User routes
  app.get("/api/user/stats", requireAuth, async (req, res) => {
    try {
      const stats = await storage.getUserStats(req.session.userId);
      res.json(stats);
    } catch (error) {
      console.error("User stats error:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  app.get("/api/user/games", requireAuth, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const games = await storage.getUserGames(req.session.userId, limit);
      res.json({ games });
    } catch (error) {
      console.error("User games error:", error);
      res.status(500).json({ message: "Failed to fetch user games" });
    }
  });

  app.put("/api/user/settings", requireAuth, async (req, res) => {
    try {
      await storage.updateUserSettings(req.session.userId, req.body);
      res.json({ message: "Settings updated successfully" });
    } catch (error) {
      console.error("Update settings error:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  app.delete("/api/user/delete", requireAuth, async (req, res) => {
    try {
      await storage.deleteUser(req.session.userId);
      req.session.destroy(() => {
        res.json({ message: "Account deleted successfully" });
      });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ message: "Failed to delete account" });
    }
  });

  app.get("/api/user/export", requireAuth, async (req, res) => {
    try {
      const data = await storage.exportUserData(req.session.userId);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=math-arena-data.json');
      res.json(data);
    } catch (error) {
      console.error("Export data error:", error);
      res.status(500).json({ message: "Failed to export data" });
    }
  });

  // Shop routes
  app.get("/api/shop/items", getUserOrGuest, async (req, res) => {
    try {
      const items = await storage.getShopItems(req.session?.userId);
      res.json({ items });
    } catch (error) {
      console.error("Shop items error:", error);
      res.status(500).json({ message: "Failed to fetch shop items" });
    }
  });

  app.post("/api/shop/purchase", requireAuth, async (req, res) => {
    try {
      const { itemId } = req.body;
      const result = await storage.purchaseItem(req.session.userId, itemId);
      
      if (!result.success) {
        return res.status(400).json({ message: result.message });
      }
      
      res.json({ message: "Purchase successful" });
    } catch (error) {
      console.error("Purchase error:", error);
      res.status(500).json({ message: "Failed to process purchase" });
    }
  });

  app.get("/api/user/currency", requireAuth, async (req, res) => {
    try {
      const currency = await storage.getUserCurrency(req.session.userId);
      res.json(currency);
    } catch (error) {
      console.error("Currency error:", error);
      res.status(500).json({ message: "Failed to fetch currency" });
    }
  });

  // Score routes
  app.post("/api/scores", requireAuth, async (req, res) => {
    try {
      await storage.saveScore({
        userId: req.session.userId,
        ...req.body,
        timestamp: new Date().toISOString(),
        status: "verified"
      });
      res.json({ message: "Score saved successfully" });
    } catch (error) {
      console.error("Save score error:", error);
      res.status(500).json({ message: "Failed to save score" });
    }
  });

  // Guest session routes
  app.get("/api/guest/:guestSessionId/pending", async (req, res) => {
    try {
      const { guestSessionId } = req.params;
      const scores = await storage.getGuestSessionScores(guestSessionId);
      res.json({ scores: scores || [] });
    } catch (error) {
      console.error("Guest pending scores error:", error);
      res.status(500).json({ message: "Failed to fetch pending scores" });
    }
  });

  app.post("/api/score/claim", requireAuth, async (req, res) => {
    try {
      const { guestSessionId } = req.body;
      const userId = req.session.userId;
      
      const result = await storage.mergeGuestSession(guestSessionId, userId);
      res.json({ success: result });
    } catch (error) {
      console.error("Claim score error:", error);
      res.status(500).json({ message: "Failed to claim scores" });
    }
  });

  // Multiplayer Rooms Routes
  app.get("/api/rooms", async (req, res) => {
    try {
      const rooms = await storage.getActiveRooms();
      res.json({ rooms });
    } catch (error) {
      console.error("Rooms fetch error:", error);
      res.status(500).json({ message: "Failed to fetch rooms" });
    }
  });

  app.post("/api/rooms", requireAuth, async (req, res) => {
    try {
      const roomData = createRoomSchema.parse(req.body);
      const room = await storage.createRoom({
        ...roomData,
        hostId: req.session.userId,
        settings: {
          timeLimit: roomData.timeLimit,
          startingHealth: roomData.startingHealth,
          powerUpsEnabled: roomData.powerUpsEnabled
        }
      });
      res.json(room);
    } catch (error) {
      console.error("Room creation error:", error);
      res.status(500).json({ message: "Failed to create room" });
    }
  });

  app.post("/api/rooms/:roomId/join", requireAuth, async (req, res) => {
    try {
      const { roomId } = req.params;
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      const result = await storage.joinRoom(roomId, userId, user?.username || "Player");
      
      if (!result.success) {
        return res.status(400).json({ message: result.message });
      }
      
      res.json({ message: "Joined room successfully" });
    } catch (error) {
      console.error("Room join error:", error);
      res.status(500).json({ message: "Failed to join room" });
    }
  });

  app.delete("/api/rooms/:roomId/leave", requireAuth, async (req, res) => {
    try {
      const { roomId } = req.params;
      const userId = req.session.userId;
      
      await storage.leaveRoom(roomId, userId);
      res.json({ message: "Left room successfully" });
    } catch (error) {
      console.error("Room leave error:", error);
      res.status(500).json({ message: "Failed to leave room" });
    }
  });

  // Achievement Routes
  app.get("/api/achievements", getUserOrGuest, async (req, res) => {
    try {
      let achievements = [];
      
      if (req.session?.userId) {
        achievements = await storage.getUserAchievements(req.session.userId);
      } else {
        // Return default achievements for guest users
        achievements = await storage.getDefaultAchievements();
      }
      
      res.json({ achievements });
    } catch (error) {
      console.error("Achievements error:", error);
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });

  app.post("/api/achievements/update", requireAuth, async (req, res) => {
    try {
      const { achievementId, progress } = req.body;
      const userId = req.session.userId;
      
      const result = await storage.updateAchievementProgress(userId, achievementId, progress);
      res.json(result);
    } catch (error) {
      console.error("Achievement update error:", error);
      res.status(500).json({ message: "Failed to update achievement" });
    }
  });

  // Analytics and Anti-cheat Routes
  app.post("/api/events", getUserOrGuest, async (req, res) => {
    try {
      const { sessionId, eventType, eventData, clientTime } = req.body;
      
      await storage.logGameEvent({
        sessionId,
        userId: req.session?.userId || null,
        guestSessionId: req.headers['guest-session-id'] as string || null,
        eventType,
        eventData,
        clientTime,
        ipAddress: req.ip || req.connection.remoteAddress || "unknown",
        userAgent: req.headers['user-agent'] || "unknown",
        timestamp: new Date()
      });
      
      // Anti-cheat analysis
      if (eventType === "answer_submit") {
        await performAntiCheatAnalysis(req, eventData);
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Event logging error:", error);
      res.status(500).json({ message: "Failed to log event" });
    }
  });

  app.post("/api/game-over", getUserOrGuest, async (req, res) => {
    try {
      const gameData = gameOverSchema.parse(req.body);
      
      // Anti-cheat validation
      const suspicionFlags = await validateGameSession(req, gameData);
      
      if (suspicionFlags.length > 0) {
        // Log suspicious activity
        await storage.logAntiCheatSuspicion({
          userId: req.session?.userId || null,
          guestSessionId: req.headers['guest-session-id'] as string || null,
          suspicionType: "game_validation_failed",
          severity: Math.max(...suspicionFlags.map(f => f.severity)),
          evidence: { flags: suspicionFlags, gameData },
          timestamp: new Date()
        });
        
        // Return without saving score if highly suspicious
        if (suspicionFlags.some(f => f.severity >= 8)) {
          return res.status(400).json({ 
            message: "Score could not be validated", 
            flags: suspicionFlags.map(f => f.type)
          });
        }
      }
      
      // Save score with appropriate status
      const scoreStatus = suspicionFlags.length > 0 ? "pending" : "verified";
      const scoreId = await storage.saveScore({
        userId: gameData.userId || null,
        guestSessionId: gameData.guestSessionId || null,
        score: gameData.stats.score,
        wave: gameData.stats.wave,
        accuracy: gameData.stats.accuracy,
        difficulty: gameData.stats.difficulty,
        mode: gameData.stats.mode,
        timeElapsed: gameData.stats.time,
        correctAnswers: gameData.stats.correct,
        totalQuestions: gameData.stats.correct + gameData.stats.wrong,
        maxCombo: gameData.stats.maxCombo,
        status: scoreStatus,
        timestamp: new Date()
      });
      
      // Update user stats and achievements
      if (req.session?.userId) {
        await storage.updateUserStats(req.session.userId, gameData.stats);
        await storage.checkAndUpdateAchievements(req.session.userId, gameData.stats);
      }
      
      res.json({ 
        success: true, 
        scoreId,
        status: scoreStatus,
        suspicionFlags: suspicionFlags.map(f => f.type)
      });
    } catch (error) {
      console.error("Game over error:", error);
      res.status(500).json({ message: "Failed to process game results" });
    }
  });

  // Friends and Social Features
  app.get("/api/friends", requireAuth, async (req, res) => {
    try {
      const friends = await storage.getUserFriends(req.session.userId);
      res.json({ friends });
    } catch (error) {
      console.error("Friends error:", error);
      res.status(500).json({ message: "Failed to fetch friends" });
    }
  });

  app.post("/api/friends/request", requireAuth, async (req, res) => {
    try {
      const { username } = req.body;
      const result = await storage.sendFriendRequest(req.session.userId, username);
      
      if (!result.success) {
        return res.status(400).json({ message: result.message });
      }
      
      res.json({ message: "Friend request sent" });
    } catch (error) {
      console.error("Friend request error:", error);
      res.status(500).json({ message: "Failed to send friend request" });
    }
  });

  // Tutorial Progress
  app.get("/api/tutorial/progress", getUserOrGuest, async (req, res) => {
    try {
      let progress = { completed: [], currentStep: 0 };
      
      if (req.session?.userId) {
        progress = await storage.getTutorialProgress(req.session.userId);
      }
      
      res.json(progress);
    } catch (error) {
      console.error("Tutorial progress error:", error);
      res.status(500).json({ message: "Failed to fetch tutorial progress" });
    }
  });

  app.post("/api/tutorial/complete", getUserOrGuest, async (req, res) => {
    try {
      const { step } = req.body;
      
      if (req.session?.userId) {
        await storage.updateTutorialProgress(req.session.userId, step);
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Tutorial complete error:", error);
      res.status(500).json({ message: "Failed to update tutorial progress" });
    }
  });

  // Announcements route
  app.get("/api/announcements", async (req, res) => {
    try {
      const announcements = [
        {
          id: "1",
          title: "Welcome to Math Survival Arena!",
          content: "Test your math skills in this exciting survival game.",
          timestamp: new Date().toISOString()
        }
      ];
      res.json({ announcements });
    } catch (error) {
      console.error("Announcements error:", error);
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  // Anti-cheat helper functions
  async function performAntiCheatAnalysis(req: any, eventData: any) {
    try {
      const suspicions = [];
      
      // Check for impossible timing
      if (eventData.responseTime && eventData.responseTime < 500) {
        suspicions.push({
          type: "impossible_timing",
          severity: 7,
          details: { responseTime: eventData.responseTime }
        });
      }
      
      // Check for pattern detection (too many perfect answers)
      if (eventData.accuracy && eventData.accuracy === 100 && eventData.questionCount > 20) {
        suspicions.push({
          type: "perfect_accuracy_suspicion",
          severity: 5,
          details: { accuracy: eventData.accuracy, questionCount: eventData.questionCount }
        });
      }
      
      if (suspicions.length > 0) {
        await storage.logAntiCheatSuspicion({
          userId: req.session?.userId || null,
          guestSessionId: req.headers['guest-session-id'] as string || null,
          suspicionType: "real_time_analysis",
          severity: Math.max(...suspicions.map(s => s.severity)),
          evidence: { suspicions, eventData },
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error("Anti-cheat analysis error:", error);
    }
  }

  async function validateGameSession(req: any, gameData: any) {
    const flags = [];
    
    // Check for impossible scores
    const maxPossibleScore = gameData.stats.correct * 100 * gameData.stats.wave;
    if (gameData.stats.score > maxPossibleScore * 2) {
      flags.push({
        type: "impossible_score",
        severity: 10,
        details: { score: gameData.stats.score, maxPossible: maxPossibleScore }
      });
    }
    
    // Check time manipulation
    const minPossibleTime = (gameData.stats.correct + gameData.stats.wrong) * 2000; // 2s minimum per question
    if (gameData.stats.time < minPossibleTime) {
      flags.push({
        type: "time_manipulation",
        severity: 9,
        details: { actualTime: gameData.stats.time, minPossible: minPossibleTime }
      });
    }
    
    // Check wave progression consistency
    const expectedQuestions = gameData.stats.wave * 3; // Rough estimate
    const actualQuestions = gameData.stats.correct + gameData.stats.wrong;
    if (actualQuestions < expectedQuestions * 0.5) {
      flags.push({
        type: "inconsistent_progression",
        severity: 6,
        details: { wave: gameData.stats.wave, questions: actualQuestions, expected: expectedQuestions }
      });
    }
    
    return flags;
  }

  const httpServer = createServer(app);
  return httpServer;
}
