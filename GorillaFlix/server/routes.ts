import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import { insertUserSchema, insertVideoSchema, updateVideoSchema, insertWatchlistSchema, insertLikeSchema, insertCommentSchema, updateCommentSchema } from "@shared/schema";
import { randomUUID } from "crypto";
import { setupAuth } from "./auth";

// Configure multer for file uploads
const videoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${randomUUID()}${ext}`);
  }
});

const upload = multer({ 
  storage: videoStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    // Accept videos and images
    if (file.mimetype.startsWith('video/') || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video and image files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Static file serving from uploads directory
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
  
  // Create uploads directory if it doesn't exist
  const uploadDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  // Setup authentication
  setupAuth(app);
  
  // Authentication check middleware
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    next();
  };
  
  // Videos API routes
  app.get('/api/videos', async (req: Request, res: Response) => {
    try {
      const videos = await storage.getAllVideos();
      res.json(videos);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch videos' });
    }
  });
  
  app.get('/api/videos/featured', async (req: Request, res: Response) => {
    try {
      const videos = await storage.getFeaturedVideos();
      res.json(videos);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch featured videos' });
    }
  });
  
  app.get('/api/videos/popular', async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const videos = await storage.getPopularVideos(limit);
      res.json(videos);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch popular videos' });
    }
  });
  
  app.get('/api/videos/category/:category', async (req: Request, res: Response) => {
    try {
      const { category } = req.params;
      const videos = await storage.getVideosByCategory(category);
      res.json(videos);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch videos by category' });
    }
  });
  
  app.get('/api/videos/search', async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: 'Search query is required' });
      }
      const videos = await storage.searchVideos(query);
      res.json(videos);
    } catch (error) {
      res.status(500).json({ message: 'Failed to search videos' });
    }
  });
  
  app.get('/api/videos/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const video = await storage.getVideo(id);
      
      if (!video) {
        return res.status(404).json({ message: 'Video not found' });
      }
      
      // Increment views
      await storage.incrementViews(id);
      
      res.json(video);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch video' });
    }
  });
  
  app.post('/api/videos', requireAuth, upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
  ]), async (req: Request, res: Response) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      if (!files.video || !files.thumbnail) {
        return res.status(400).json({ message: 'Both video and thumbnail are required' });
      }
      
      const videoFile = files.video[0];
      const thumbnailFile = files.thumbnail[0];
      
      // Use authenticated user ID
      const videoData = {
        ...req.body,
        userId: req.user!.id, // We know this exists because of requireAuth
        videoUrl: `/uploads/${videoFile.filename}`,
        thumbnail: `/uploads/${thumbnailFile.filename}`,
        featured: req.body.featured === 'true'
      };
      
      const parseResult = insertVideoSchema.safeParse(videoData);
      
      if (!parseResult.success) {
        return res.status(400).json({ message: 'Invalid video data', errors: parseResult.error });
      }
      
      const newVideo = await storage.createVideo(parseResult.data);
      res.status(201).json(newVideo);
    } catch (error) {
      res.status(500).json({ message: 'Failed to upload video' });
    }
  });
  
  app.put('/api/videos/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const video = await storage.getVideo(id);
      
      if (!video) {
        return res.status(404).json({ message: 'Video not found' });
      }
      
      const updateData = {
        ...req.body,
        featured: req.body.featured === 'true'
      };
      
      const parseResult = updateVideoSchema.safeParse(updateData);
      
      if (!parseResult.success) {
        return res.status(400).json({ message: 'Invalid update data', errors: parseResult.error });
      }
      
      const updatedVideo = await storage.updateVideo(id, parseResult.data);
      res.json(updatedVideo);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update video' });
    }
  });
  
  // Regular delete video (owner can delete their own videos, admin can delete any video)
  app.delete('/api/videos/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const video = await storage.getVideo(id);
      
      if (!video) {
        return res.status(404).json({ message: 'Video not found' });
      }
      
      // Allow admin (user ID 1) to delete any video, otherwise only the owner can delete
      const isAdmin = req.user!.id === 1;
      if (!isAdmin && video.userId !== req.user!.id) {
        return res.status(403).json({ message: 'You can only delete your own videos' });
      }
      
      // Delete video and thumbnail files
      if (video.videoUrl) {
        const videoPath = path.join(process.cwd(), video.videoUrl.replace(/^\/uploads/, 'uploads'));
        if (fs.existsSync(videoPath)) {
          fs.unlinkSync(videoPath);
        }
      }
      
      if (video.thumbnail) {
        const thumbnailPath = path.join(process.cwd(), video.thumbnail.replace(/^\/uploads/, 'uploads'));
        if (fs.existsSync(thumbnailPath)) {
          fs.unlinkSync(thumbnailPath);
        }
      }
      
      await storage.deleteVideo(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete video' });
    }
  });
  
  // Admin moderation endpoint - only Gorilla Tag Dev (user ID 1) can terminate videos
  app.delete('/api/moderation/videos/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      // Check if the user is Gorilla Tag Dev (admin)
      if (req.user!.id !== 1) {
        return res.status(403).json({ message: 'Only administrators can terminate videos' });
      }
      
      const id = parseInt(req.params.id);
      const video = await storage.getVideo(id);
      
      if (!video) {
        return res.status(404).json({ message: 'Video not found' });
      }
      
      const reason = req.body.reason || 'Violation of community guidelines';
      
      // Delete video and thumbnail files
      if (video.videoUrl) {
        const videoPath = path.join(process.cwd(), video.videoUrl.replace(/^\/uploads/, 'uploads'));
        if (fs.existsSync(videoPath)) {
          fs.unlinkSync(videoPath);
        }
      }
      
      if (video.thumbnail) {
        const thumbnailPath = path.join(process.cwd(), video.thumbnail.replace(/^\/uploads/, 'uploads'));
        if (fs.existsSync(thumbnailPath)) {
          fs.unlinkSync(thumbnailPath);
        }
      }
      
      await storage.deleteVideo(id);
      res.json({ 
        success: true, 
        message: `Video ${id} terminated by admin for: ${reason}`
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to terminate video' });
    }
  });
  
  // User API routes
  app.post('/api/users', async (req: Request, res: Response) => {
    try {
      const parseResult = insertUserSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ message: 'Invalid user data', errors: parseResult.error });
      }
      
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(409).json({ message: 'Username already exists' });
      }
      
      const newUser = await storage.createUser(parseResult.data);
      res.status(201).json(newUser);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create user' });
    }
  });
  
  // Upload user avatar
  app.post('/api/users/:id/avatar', requireAuth, upload.single('avatar'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if the authenticated user is trying to update their own profile
      if (req.user!.id !== id) {
        return res.status(403).json({ message: 'You can only update your own profile' });
      }
      
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      // Get the file path relative to the uploads directory
      const avatarPath = `/uploads/${req.file.filename}`;
      
      // Update user with new avatar path
      const updatedUser = await storage.updateUser(id, { 
        username: user.username, // Keep the same username
        avatar: avatarPath 
      });
      
      if (!updatedUser) {
        return res.status(500).json({ message: 'Failed to update avatar' });
      }
      
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      res.status(500).json({ message: 'Failed to upload avatar' });
    }
  });
  
  app.get('/api/users/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch user' });
    }
  });
  
  // Update user profile
  app.put('/api/users/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if the authenticated user is trying to update their own profile
      if (req.user!.id !== id) {
        return res.status(403).json({ message: 'You can only update your own profile' });
      }
      
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Update user data
      const updateData = req.body;
      
      // Don't update password through this endpoint for security
      if (updateData.password) {
        delete updateData.password;
      }
      
      const updatedUser = await storage.updateUser(id, updateData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'Failed to update user' });
      }
      
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ message: 'Failed to update user' });
    }
  });
  
  app.get('/api/users/:id/videos', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const videos = await storage.getUserVideos(id);
      res.json(videos);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch user videos' });
    }
  });
  
  // Watchlist API routes
  app.get('/api/watchlist', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const watchlist = await storage.getWatchlist(userId);
      res.json(watchlist);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch watchlist' });
    }
  });
  
  // Keep the old endpoint for backward compatibility
  app.get('/api/users/:id/watchlist', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const watchlist = await storage.getWatchlist(userId);
      res.json(watchlist);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch watchlist' });
    }
  });
  
  app.post('/api/watchlist', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const videoId = parseInt(req.body.videoId);
      
      if (isNaN(videoId)) {
        return res.status(400).json({ message: 'Invalid video ID' });
      }
      
      const video = await storage.getVideo(videoId);
      if (!video) {
        return res.status(404).json({ message: 'Video not found' });
      }
      
      const newItem = await storage.addToWatchlist({
        userId,
        videoId
      });
      
      res.status(201).json(newItem);
    } catch (error) {
      res.status(500).json({ message: 'Failed to add to watchlist' });
    }
  });
  
  app.delete('/api/watchlist/:videoId', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const videoId = parseInt(req.params.videoId);
      
      if (isNaN(videoId)) {
        return res.status(400).json({ message: 'Invalid video ID' });
      }
      
      const result = await storage.removeFromWatchlist(userId, videoId);
      
      if (!result) {
        return res.status(404).json({ message: 'Watchlist item not found' });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: 'Failed to remove from watchlist' });
    }
  });
  
  // Keep old endpoint for backward compatibility
  app.delete('/api/watchlist/:userId/:videoId', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const videoId = parseInt(req.params.videoId);
      
      const result = await storage.removeFromWatchlist(userId, videoId);
      
      if (!result) {
        return res.status(404).json({ message: 'Watchlist item not found' });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: 'Failed to remove from watchlist' });
    }
  });
  
  app.get('/api/watchlist/check/:videoId', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const videoId = parseInt(req.params.videoId);
      
      if (isNaN(videoId)) {
        return res.status(400).json({ message: 'Invalid video ID' });
      }
      
      const isInWatchlist = await storage.isInWatchlist(userId, videoId);
      res.json({ isInWatchlist });
    } catch (error) {
      res.status(500).json({ message: 'Failed to check watchlist status' });
    }
  });
  
  // Keep old endpoint for backward compatibility
  app.get('/api/watchlist/check/:userId/:videoId', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const videoId = parseInt(req.params.videoId);
      
      const isInWatchlist = await storage.isInWatchlist(userId, videoId);
      res.json({ isInWatchlist });
    } catch (error) {
      res.status(500).json({ message: 'Failed to check watchlist status' });
    }
  });
  
  // Likes API routes
  app.post('/api/likes', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const videoId = parseInt(req.body.videoId);
      
      if (isNaN(videoId)) {
        return res.status(400).json({ message: 'Invalid video ID' });
      }
      
      const video = await storage.getVideo(videoId);
      if (!video) {
        return res.status(404).json({ message: 'Video not found' });
      }
      
      const like = await storage.likeVideo(userId, videoId);
      res.status(201).json(like);
    } catch (error) {
      res.status(500).json({ message: 'Failed to like video' });
    }
  });
  
  app.delete('/api/likes/:videoId', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const videoId = parseInt(req.params.videoId);
      
      if (isNaN(videoId)) {
        return res.status(400).json({ message: 'Invalid video ID' });
      }
      
      const result = await storage.unlikeVideo(userId, videoId);
      
      if (!result) {
        return res.status(404).json({ message: 'Like not found' });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: 'Failed to unlike video' });
    }
  });
  
  app.get('/api/likes/check/:videoId', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const videoId = parseInt(req.params.videoId);
      
      if (isNaN(videoId)) {
        return res.status(400).json({ message: 'Invalid video ID' });
      }
      
      const isLiked = await storage.isVideoLiked(userId, videoId);
      res.json({ isLiked });
    } catch (error) {
      res.status(500).json({ message: 'Failed to check like status' });
    }
  });
  
  // Dislikes API routes
  app.post('/api/dislikes', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const videoId = parseInt(req.body.videoId);
      
      if (isNaN(videoId)) {
        return res.status(400).json({ message: 'Invalid video ID' });
      }
      
      const video = await storage.getVideo(videoId);
      if (!video) {
        return res.status(404).json({ message: 'Video not found' });
      }
      
      const dislike = await storage.dislikeVideo(userId, videoId);
      res.status(201).json(dislike);
    } catch (error) {
      res.status(500).json({ message: 'Failed to dislike video' });
    }
  });
  
  app.delete('/api/dislikes/:videoId', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const videoId = parseInt(req.params.videoId);
      
      if (isNaN(videoId)) {
        return res.status(400).json({ message: 'Invalid video ID' });
      }
      
      const result = await storage.undislikeVideo(userId, videoId);
      
      if (!result) {
        return res.status(404).json({ message: 'Dislike not found' });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: 'Failed to undislike video' });
    }
  });
  
  app.get('/api/dislikes/check/:videoId', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const videoId = parseInt(req.params.videoId);
      
      if (isNaN(videoId)) {
        return res.status(400).json({ message: 'Invalid video ID' });
      }
      
      const isDisliked = await storage.isVideoDisliked(userId, videoId);
      res.json({ isDisliked });
    } catch (error) {
      res.status(500).json({ message: 'Failed to check dislike status' });
    }
  });
  
  // Comments API routes
  app.get('/api/videos/:videoId/comments', async (req: Request, res: Response) => {
    try {
      const videoId = parseInt(req.params.videoId);
      
      if (isNaN(videoId)) {
        return res.status(400).json({ message: 'Invalid video ID' });
      }
      
      const video = await storage.getVideo(videoId);
      if (!video) {
        return res.status(404).json({ message: 'Video not found' });
      }
      
      const comments = await storage.getVideoComments(videoId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch comments' });
    }
  });
  
  app.post('/api/videos/:videoId/comments', requireAuth, async (req: Request, res: Response) => {
    try {
      const videoId = parseInt(req.params.videoId);
      const userId = req.user!.id;
      
      if (isNaN(videoId)) {
        return res.status(400).json({ message: 'Invalid video ID' });
      }
      
      const video = await storage.getVideo(videoId);
      if (!video) {
        return res.status(404).json({ message: 'Video not found' });
      }
      
      const commentData = {
        content: req.body.content,
        userId,
        videoId
      };
      
      const parseResult = insertCommentSchema.safeParse(commentData);
      
      if (!parseResult.success) {
        return res.status(400).json({ message: 'Invalid comment data', errors: parseResult.error });
      }
      
      const newComment = await storage.createComment(parseResult.data);
      
      // Get the full comment with user data for the response
      const comments = await storage.getVideoComments(videoId);
      const commentWithUser = comments.find(c => c.id === newComment.id);
      
      res.status(201).json(commentWithUser);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create comment' });
    }
  });
  
  app.put('/api/comments/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const commentId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      if (isNaN(commentId)) {
        return res.status(400).json({ message: 'Invalid comment ID' });
      }
      
      const updateData = {
        content: req.body.content
      };
      
      const parseResult = updateCommentSchema.safeParse(updateData);
      
      if (!parseResult.success) {
        return res.status(400).json({ message: 'Invalid comment data', errors: parseResult.error });
      }
      
      const updatedComment = await storage.updateComment(commentId, userId, parseResult.data);
      
      if (!updatedComment) {
        return res.status(404).json({ message: 'Comment not found or you do not have permission to edit it' });
      }
      
      res.json(updatedComment);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update comment' });
    }
  });
  
  app.delete('/api/comments/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const commentId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      if (isNaN(commentId)) {
        return res.status(400).json({ message: 'Invalid comment ID' });
      }
      
      const result = await storage.deleteComment(commentId, userId);
      
      if (!result) {
        return res.status(404).json({ message: 'Comment not found or you do not have permission to delete it' });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete comment' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

import express from "express";
