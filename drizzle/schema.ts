import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * 用户档案表 - 存储用户的基本信息和关系状态
 */
export const userProfiles = mysqlTable("userProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  novaName: varchar("novaName", { length: 64 }).default("Nova").notNull(),
  userName: varchar("userName", { length: 128 }),
  userAge: int("userAge"),
  userInterests: text("userInterests"), // JSON array of interests
  importantEvents: text("importantEvents"), // JSON array of important events
  relationshipLevel: mysqlEnum("relationshipLevel", [
    "stranger",
    "friend",
    "ambiguous",
    "lover",
    "intimate_partner",
  ])
    .default("stranger")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;

/**
 * 长期记忆表 - 存储重要的聊天信息
 */
export const memories = mysqlTable("memories", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(), // 记忆内容
  category: mysqlEnum("category", [
    "personal_info", // 个人信息
    "birthday", // 生日
    "preference", // 偏好
    "experience", // 经历
    "emotion", // 情感
    "event", // 事件
  ]).notNull(),
  importance: int("importance").default(5).notNull(), // 1-10，重要程度
  relatedMessages: text("relatedMessages"), // JSON array of related message IDs
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastAccessedAt: timestamp("lastAccessedAt").defaultNow().notNull(),
});

export type Memory = typeof memories.$inferSelect;
export type InsertMemory = typeof memories.$inferInsert;

/**
 * 情绪历史表 - 记录用户的情绪变化
 */
export const emotionHistory = mysqlTable("emotionHistory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  emotion: mysqlEnum("emotion", [
    "happy", // 开心
    "sad", // 伤心
    "angry", // 愤怒
    "anxious", // 焦虑
    "lonely", // 孤独
    "neutral", // 中立
    "excited", // 兴奋
    "calm", // 平静
  ]).notNull(),
  intensity: int("intensity").notNull(), // 1-10，情绪强度
  messageContent: text("messageContent"), // 触发情绪的消息内容
  novaResponse: text("novaResponse"), // Nova 的回应
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmotionRecord = typeof emotionHistory.$inferSelect;
export type InsertEmotionRecord = typeof emotionHistory.$inferInsert;

/**
 * 人格演化表 - 记录人格参数的变化
 */
export const personalityEvolution = mysqlTable("personalityEvolution", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  gentleness: int("gentleness").default(50).notNull(), // 温柔度 0-100
  liveliness: int("liveliness").default(50).notNull(), // 活泼度 0-100
  intellectuality: int("intellectuality").default(50).notNull(), // 知性度 0-100
  mischief: int("mischief").default(50).notNull(), // 调皮度 0-100
  mystery: int("mystery").default(50).notNull(), // 神秘度 0-100
  triggerEvent: varchar("triggerEvent", { length: 128 }), // 触发事件 (praise, coldness, intimacy, etc.)
  triggerMessage: text("triggerMessage"), // 触发消息
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PersonalityRecord = typeof personalityEvolution.$inferSelect;
export type InsertPersonalityRecord = typeof personalityEvolution.$inferInsert;

/**
 * 关系进度表 - 记录与用户的关系进度
 */
export const relationshipProgress = mysqlTable("relationshipProgress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  currentLevel: mysqlEnum("currentLevel", [
    "stranger",
    "friend",
    "ambiguous",
    "lover",
    "intimate_partner",
  ])
    .default("stranger")
    .notNull(),
  progressPoints: int("progressPoints").default(0).notNull(), // 关系进度点数
  milestones: text("milestones"), // JSON array of reached milestones
  lastLevelUpAt: timestamp("lastLevelUpAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RelationshipRecord = typeof relationshipProgress.$inferSelect;
export type InsertRelationshipRecord = typeof relationshipProgress.$inferInsert;
