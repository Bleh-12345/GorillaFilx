import { pgTable, text, serial, integer, boolean, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  avatar: text("avatar"),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  thumbnail: text("thumbnail").notNull(),
  videoUrl: text("video_url").notNull(),
  category: text("category").notNull(),
  userId: integer("user_id").notNull(),
  views: integer("views").default(0),
  likes: integer("likes").default(0),
  dislikes: integer("dislikes").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  featured: boolean("featured").default(false),
});

export const watchlist = pgTable("watchlist", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  videoId: integer("video_id").notNull(),
  addedAt: timestamp("added_at").defaultNow(),
});

// Table for tracking video likes
export const likes = pgTable("likes", {
  userId: integer("user_id").notNull(),
  videoId: integer("video_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.userId, table.videoId] }),
  }
});

// Table for tracking video dislikes
export const dislikes = pgTable("dislikes", {
  userId: integer("user_id").notNull(),
  videoId: integer("video_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.userId, table.videoId] }),
  }
});

// Table for video comments
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  userId: integer("user_id").notNull(), 
  videoId: integer("video_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// User schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  avatar: true,
});

export const updateUserSchema = createInsertSchema(users).pick({
  username: true,
  avatar: true,
  bio: true,
});

// Video schemas
export const insertVideoSchema = createInsertSchema(videos).pick({
  title: true,
  description: true,
  thumbnail: true,
  videoUrl: true,
  category: true,
  userId: true,
  featured: true,
});

export const updateVideoSchema = createInsertSchema(videos).pick({
  title: true,
  description: true,
  thumbnail: true,
  category: true,
  featured: true,
});

// Watchlist schemas
export const insertWatchlistSchema = createInsertSchema(watchlist).pick({
  userId: true,
  videoId: true,
});

// Likes schemas
export const insertLikeSchema = createInsertSchema(likes).pick({
  userId: true,
  videoId: true,
});

// Dislikes schemas
export const insertDislikeSchema = createInsertSchema(dislikes).pick({
  userId: true,
  videoId: true,
});

// Comments schemas
export const insertCommentSchema = createInsertSchema(comments).pick({
  content: true,
  userId: true,
  videoId: true,
});

export const updateCommentSchema = createInsertSchema(comments).pick({
  content: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;

export type Video = typeof videos.$inferSelect;
export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type UpdateVideo = z.infer<typeof updateVideoSchema>;

export type Watchlist = typeof watchlist.$inferSelect;
export type InsertWatchlist = z.infer<typeof insertWatchlistSchema>;

export type Like = typeof likes.$inferSelect;
export type InsertLike = z.infer<typeof insertLikeSchema>;

export type Dislike = typeof dislikes.$inferSelect;
export type InsertDislike = z.infer<typeof insertDislikeSchema>;

export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type UpdateComment = z.infer<typeof updateCommentSchema>;

// Categories for videos
export const videoCategories = [
  "Action",
  "Comedy",
  "Documentary",
  "Gameplay",
  "Tutorial",
  "Competition",
  "Adventure",
  "Short Film",
];
