import { pgTable, text, serial, integer, boolean, timestamp, json, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  stats: json("stats").$type<{
    totalGames: number;
    totalScore: number;
    bestScore: number;
    bestWave: number;
    averageAccuracy: number;
    totalPlayTime: number;
  }>().default({
    totalGames: 0,
    totalScore: 0,
    bestScore: 0,
    bestWave: 0,
    averageAccuracy: 0,
    totalPlayTime: 0
  }),
  settings: json("settings").$type<{
    language?: string;
    audioEnabled?: boolean;
    reducedMotion?: boolean;
    notifications?: boolean;
  }>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const guestSessions = pgTable("guest_sessions", {
  id: text("id").primaryKey(),
  fingerprint: text("fingerprint").notNull(),
  ipAddress: text("ip_address").notNull(),
  userAgent: text("user_agent").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  pendingScores: json("pending_scores").$type<string[]>().default([])
});

export const questions = pgTable("questions", {
  id: text("id").primaryKey(),
  text: text("text").notNull(),
  answer: integer("answer").notNull(),
  difficulty: text("difficulty", { enum: ["easy", "medium", "hard"] }).notNull(),
  type: text("type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull()
});

export const scores = pgTable("scores", {
  id: text("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).nullable(),
  guestSessionId: text("guest_session_id").references(() => guestSessions.id).nullable(),
  score: integer("score").notNull(),
  wave: integer("wave").notNull(),
  accuracy: decimal("accuracy", { precision: 5, scale: 2 }).notNull(),
  difficulty: text("difficulty", { enum: ["easy", "medium", "hard"] }).notNull(),
  mode: text("mode").notNull(),
  timeElapsed: integer("time_elapsed").notNull(),
  correctAnswers: integer("correct_answers").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  maxCombo: integer("max_combo").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  status: text("status", { enum: ["verified", "pending", "rejected"] }).default("verified").notNull()
});

export const shopItems = pgTable("shop_items", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(),
  currency: text("currency", { enum: ["coins", "gems"] }).notNull(),
  category: text("category", { enum: ["powerup", "cosmetic", "boost"] }).notNull(),
  icon: text("icon").notNull(),
  active: boolean("active").default(true).notNull()
});

export const userPurchases = pgTable("user_purchases", {
  id: text("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  itemId: text("item_id").references(() => shopItems.id).notNull(),
  purchaseDate: timestamp("purchase_date").defaultNow().notNull(),
  price: integer("price").notNull(),
  currency: text("currency", { enum: ["coins", "gems"] }).notNull()
});

export const userCurrency = pgTable("user_currency", {
  userId: integer("user_id").references(() => users.id).primaryKey(),
  coins: integer("coins").default(100).notNull(),
  gems: integer("gems").default(0).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const userAchievements = pgTable("user_achievements", {
  id: text("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  achievementId: text("achievement_id").notNull(),
  progress: integer("progress").default(0).notNull(),
  unlocked: boolean("unlocked").default(false).notNull(),
  unlockedAt: timestamp("unlocked_at").nullable()
});

export const gameEvents = pgTable("game_events", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  userId: integer("user_id").references(() => users.id).nullable(),
  guestSessionId: text("guest_session_id").references(() => guestSessions.id).nullable(),
  eventType: text("event_type").notNull(), // "question_start", "answer_submit", "powerup_use", etc
  eventData: json("event_data").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  clientTime: integer("client_time").notNull(),
  ipAddress: text("ip_address").notNull(),
  userAgent: text("user_agent").notNull()
});

export const antiCheatLogs = pgTable("anti_cheat_logs", {
  id: text("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).nullable(),
  guestSessionId: text("guest_session_id").references(() => guestSessions.id).nullable(),
  suspicionType: text("suspicion_type").notNull(), // "time_manipulation", "impossible_score", etc
  severity: integer("severity").notNull(), // 1-10 scale
  evidence: json("evidence").notNull(),
  resolved: boolean("resolved").default(false).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull()
});

export const gameRooms = pgTable("game_rooms", {
  id: text("id").primaryKey(),
  hostId: integer("host_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  mode: text("mode").notNull(),
  difficulty: text("difficulty", { enum: ["easy", "medium", "hard"] }).notNull(),
  maxPlayers: integer("max_players").default(4).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  settings: json("settings").$type<{
    timeLimit?: number;
    startingHealth?: number;
    powerUpsEnabled?: boolean;
  }>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const roomPlayers = pgTable("room_players", {
  id: text("id").primaryKey(),
  roomId: text("room_id").references(() => gameRooms.id).notNull(),
  userId: integer("user_id").references(() => users.id).nullable(),
  guestSessionId: text("guest_session_id").references(() => guestSessions.id).nullable(),
  playerName: text("player_name").notNull(),
  isReady: boolean("is_ready").default(false).notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull()
});

// Schema exports for validation
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  passwordHash: true,
  stats: true,
  settings: true
});

export const insertGuestSessionSchema = createInsertSchema(guestSessions).pick({
  id: true,
  fingerprint: true,
  ipAddress: true,
  userAgent: true,
  expiresAt: true
});

export const insertScoreSchema = createInsertSchema(scores).pick({
  userId: true,
  guestSessionId: true,
  score: true,
  wave: true,
  accuracy: true,
  difficulty: true,
  mode: true,
  timeElapsed: true,
  correctAnswers: true,
  totalQuestions: true,
  maxCombo: true,
  status: true
});

export const insertShopItemSchema = createInsertSchema(shopItems);
export const insertUserPurchaseSchema = createInsertSchema(userPurchases);
export const insertGameRoomSchema = createInsertSchema(gameRooms);

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type GuestSession = typeof guestSessions.$inferSelect;
export type InsertGuestSession = z.infer<typeof insertGuestSessionSchema>;
export type Question = typeof questions.$inferSelect;
export type Score = typeof scores.$inferSelect;
export type InsertScore = z.infer<typeof insertScoreSchema>;
export type ShopItem = typeof shopItems.$inferSelect;
export type UserPurchase = typeof userPurchases.$inferSelect;
export type UserCurrency = typeof userCurrency.$inferSelect;
export type GameRoom = typeof gameRooms.$inferSelect;
export type RoomPlayer = typeof roomPlayers.$inferSelect;
