import { 
  users, User, InsertUser, UpdateUser,
  videos, Video, InsertVideo, UpdateVideo,
  watchlist, Watchlist, InsertWatchlist,
  likes, Like, InsertLike,
  dislikes, Dislike, InsertDislike,
  comments, Comment, InsertComment, UpdateComment
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, like, asc } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

// Storage interface for all data operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: UpdateUser): Promise<User | undefined>;
  
  // Video operations
  getVideo(id: number): Promise<Video | undefined>;
  getAllVideos(): Promise<Video[]>;
  getVideosByCategory(category: string): Promise<Video[]>;
  getFeaturedVideos(): Promise<Video[]>;
  getPopularVideos(limit?: number): Promise<Video[]>;
  getUserVideos(userId: number): Promise<Video[]>;
  createVideo(video: InsertVideo): Promise<Video>;
  updateVideo(id: number, updates: UpdateVideo): Promise<Video | undefined>;
  deleteVideo(id: number): Promise<boolean>;
  incrementViews(id: number): Promise<Video | undefined>;
  searchVideos(query: string): Promise<Video[]>;
  
  // Watchlist operations
  getWatchlist(userId: number): Promise<Video[]>;
  addToWatchlist(item: InsertWatchlist): Promise<Watchlist>;
  removeFromWatchlist(userId: number, videoId: number): Promise<boolean>;
  isInWatchlist(userId: number, videoId: number): Promise<boolean>;
  
  // Likes operations
  likeVideo(userId: number, videoId: number): Promise<Like>;
  unlikeVideo(userId: number, videoId: number): Promise<boolean>;
  isVideoLiked(userId: number, videoId: number): Promise<boolean>;
  
  // Dislikes operations
  dislikeVideo(userId: number, videoId: number): Promise<Dislike>;
  undislikeVideo(userId: number, videoId: number): Promise<boolean>;
  isVideoDisliked(userId: number, videoId: number): Promise<boolean>;
  
  // Comments operations
  getVideoComments(videoId: number): Promise<(Comment & { user: User })[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  deleteComment(id: number, userId: number): Promise<boolean>;
  updateComment(id: number, userId: number, updates: UpdateComment): Promise<Comment | undefined>;
  
  // Session store
  sessionStore: session.Store;
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    const PostgresStore = connectPg(session);
    this.sessionStore = new PostgresStore({ 
      pool, 
      tableName: 'session',
      createTableIfMissing: true
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }
  
  async updateUser(id: number, updates: UpdateUser): Promise<User | undefined> {
    const result = await db.update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }
  
  // Video operations
  async getVideo(id: number): Promise<Video | undefined> {
    const result = await db.select().from(videos).where(eq(videos.id, id));
    return result[0];
  }
  
  async getAllVideos(): Promise<Video[]> {
    return await db.select().from(videos);
  }
  
  async getVideosByCategory(category: string): Promise<Video[]> {
    return await db.select().from(videos).where(eq(videos.category, category));
  }
  
  async getFeaturedVideos(): Promise<Video[]> {
    return await db.select().from(videos).where(eq(videos.featured, true));
  }
  
  async getPopularVideos(limit = 10): Promise<Video[]> {
    return await db.select().from(videos).orderBy(desc(videos.views)).limit(limit);
  }
  
  async getUserVideos(userId: number): Promise<Video[]> {
    return await db.select().from(videos).where(eq(videos.userId, userId));
  }
  
  async createVideo(video: InsertVideo): Promise<Video> {
    const result = await db.insert(videos).values({
      ...video,
      views: 0,
      likes: 0,
      dislikes: 0
    }).returning();
    return result[0];
  }
  
  async updateVideo(id: number, updates: UpdateVideo): Promise<Video | undefined> {
    const result = await db.update(videos)
      .set(updates)
      .where(eq(videos.id, id))
      .returning();
    return result[0];
  }
  
  async deleteVideo(id: number): Promise<boolean> {
    const result = await db.delete(videos).where(eq(videos.id, id)).returning();
    return result.length > 0;
  }
  
  async incrementViews(id: number): Promise<Video | undefined> {
    const result = await db.update(videos)
      .set({ views: sql`${videos.views} + 1` })
      .where(eq(videos.id, id))
      .returning();
    return result[0];
  }
  
  async searchVideos(query: string): Promise<Video[]> {
    const searchPattern = `%${query}%`;
    return await db.select().from(videos).where(
      sql`${videos.title} ilike ${searchPattern} or ${videos.description} ilike ${searchPattern}`
    );
  }
  
  // Watchlist operations
  async getWatchlist(userId: number): Promise<Video[]> {
    const result = await db.select({
      video: videos
    })
    .from(watchlist)
    .innerJoin(videos, eq(watchlist.videoId, videos.id))
    .where(eq(watchlist.userId, userId))
    .orderBy(desc(watchlist.addedAt));
    
    return result.map(r => r.video);
  }
  
  async addToWatchlist(item: InsertWatchlist): Promise<Watchlist> {
    // Check if already in watchlist
    const existing = await db.select().from(watchlist).where(
      and(
        eq(watchlist.userId, item.userId),
        eq(watchlist.videoId, item.videoId)
      )
    );
    
    if (existing.length > 0) {
      return existing[0];
    }
    
    const result = await db.insert(watchlist).values(item).returning();
    return result[0];
  }
  
  async removeFromWatchlist(userId: number, videoId: number): Promise<boolean> {
    const result = await db.delete(watchlist).where(
      and(
        eq(watchlist.userId, userId),
        eq(watchlist.videoId, videoId)
      )
    ).returning();
    
    return result.length > 0;
  }
  
  async isInWatchlist(userId: number, videoId: number): Promise<boolean> {
    const result = await db.select().from(watchlist).where(
      and(
        eq(watchlist.userId, userId),
        eq(watchlist.videoId, videoId)
      )
    );
    
    return result.length > 0;
  }
  
  // Likes operations
  async likeVideo(userId: number, videoId: number): Promise<Like> {
    // Check if already liked
    const existing = await db.select().from(likes).where(
      and(
        eq(likes.userId, userId),
        eq(likes.videoId, videoId)
      )
    );
    
    if (existing.length > 0) {
      return existing[0];
    }
    
    // Add like and increment count in video
    const newLike = await db.transaction(async (tx) => {
      // Insert like
      const likeResult = await tx.insert(likes).values({
        userId,
        videoId
      }).returning();
      
      // Update video likes count
      await tx.update(videos)
        .set({ likes: sql`${videos.likes} + 1` })
        .where(eq(videos.id, videoId));
      
      return likeResult[0];
    });
    
    return newLike;
  }
  
  async unlikeVideo(userId: number, videoId: number): Promise<boolean> {
    // Remove like and decrement count in video
    const result = await db.transaction(async (tx) => {
      // Delete like
      const deleteResult = await tx.delete(likes).where(
        and(
          eq(likes.userId, userId),
          eq(likes.videoId, videoId)
        )
      ).returning();
      
      // Update video likes count if a like was removed
      if (deleteResult.length > 0) {
        await tx.update(videos)
          .set({ likes: sql`${videos.likes} - 1` })
          .where(eq(videos.id, videoId));
      }
      
      return deleteResult.length > 0;
    });
    
    return result;
  }
  
  async isVideoLiked(userId: number, videoId: number): Promise<boolean> {
    const result = await db.select().from(likes).where(
      and(
        eq(likes.userId, userId),
        eq(likes.videoId, videoId)
      )
    );
    
    return result.length > 0;
  }
  
  // Dislikes operations
  async dislikeVideo(userId: number, videoId: number): Promise<Dislike> {
    // Check if already disliked
    const existing = await db.select().from(dislikes).where(
      and(
        eq(dislikes.userId, userId),
        eq(dislikes.videoId, videoId)
      )
    );
    
    if (existing.length > 0) {
      return existing[0];
    }
    
    // Add dislike and increment count in video
    const newDislike = await db.transaction(async (tx) => {
      // Insert dislike
      const dislikeResult = await tx.insert(dislikes).values({
        userId,
        videoId
      }).returning();
      
      // Update video dislikes count
      await tx.update(videos)
        .set({ dislikes: sql`${videos.dislikes} + 1` })
        .where(eq(videos.id, videoId));
      
      return dislikeResult[0];
    });
    
    return newDislike;
  }
  
  async undislikeVideo(userId: number, videoId: number): Promise<boolean> {
    // Remove dislike and decrement count in video
    const result = await db.transaction(async (tx) => {
      // Delete dislike
      const deleteResult = await tx.delete(dislikes).where(
        and(
          eq(dislikes.userId, userId),
          eq(dislikes.videoId, videoId)
        )
      ).returning();
      
      // Update video dislikes count if a dislike was removed
      if (deleteResult.length > 0) {
        await tx.update(videos)
          .set({ dislikes: sql`${videos.dislikes} - 1` })
          .where(eq(videos.id, videoId));
      }
      
      return deleteResult.length > 0;
    });
    
    return result;
  }
  
  async isVideoDisliked(userId: number, videoId: number): Promise<boolean> {
    const result = await db.select().from(dislikes).where(
      and(
        eq(dislikes.userId, userId),
        eq(dislikes.videoId, videoId)
      )
    );
    
    return result.length > 0;
  }
  
  // Comments operations
  async getVideoComments(videoId: number): Promise<(Comment & { user: User })[]> {
    const result = await db.select({
      comment: comments,
      user: users
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.videoId, videoId))
    .orderBy(desc(comments.createdAt));
    
    return result.map(r => ({
      ...r.comment,
      user: r.user
    }));
  }
  
  async createComment(comment: InsertComment): Promise<Comment> {
    const result = await db.insert(comments).values(comment).returning();
    return result[0];
  }
  
  async deleteComment(id: number, userId: number): Promise<boolean> {
    // Only allow users to delete their own comments
    const result = await db.delete(comments).where(
      and(
        eq(comments.id, id),
        eq(comments.userId, userId)
      )
    ).returning();
    
    return result.length > 0;
  }
  
  async updateComment(id: number, userId: number, updates: UpdateComment): Promise<Comment | undefined> {
    // Only allow users to update their own comments
    const result = await db.update(comments)
      .set(updates)
      .where(
        and(
          eq(comments.id, id),
          eq(comments.userId, userId)
        )
      )
      .returning();
    
    return result[0];
  }
}

export const storage = new DatabaseStorage();
