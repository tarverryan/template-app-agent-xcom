/**
 * Template Post Manager - Database Operations for Bot Posts
 * 
 * This class manages all database operations related to bot posts including:
 * - Retrieving next available posts
 * - Marking posts as used
 * - Storing new posts with uniqueness checking
 * - Managing post statistics and metadata
 * - Content validation and deduplication
 * 
 * Key Features:
 * - Automatic content hash generation for uniqueness
 * - Transaction support for data integrity
 * - Comprehensive error handling and logging
 * - Post lifecycle management (creation, usage, statistics)
 * 
 * @author Your Name
 * @version 1.0.0
 */

import { Post, PostGenerationResult } from '../shared/types';
import { DatabaseConnection } from '../shared/database/connection';
import { logger } from '../utils/logger';
import { createHash } from 'crypto';

/**
 * Template Post Manager Class
 *
 * Manages all post-related database operations for the X.com Bot Template.
 * Handles post lifecycle from creation to usage, including content validation
 * and uniqueness checking to prevent duplicate posts.
 */
export class TemplatePostManager {
  private botId: string;

  /**
   * Constructor - Initialize post manager with database connection
   * 
   * @param db - Database connection instance for persistent storage
   */
  constructor(private db: DatabaseConnection) {
    this.botId = process.env.BOT_NAME || 'template-bot';
  }

  /**
   * Initialize Post Manager - Set up database connection and validate schema
   * 
   * This method ensures the database is properly initialized and the required
   * tables exist before any post operations can be performed.
   * 
   * @throws Error if database initialization fails
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing Template Post Manager...');
      
      // Ensure database is initialized with proper schema
      await this.db.initialize();
      
      logger.info('Template Post Manager initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Post Manager:', error);
      throw error;
    }
  }

  /**
   * Get Next Available Post - Retrieve the next unused post for posting
   * 
   * This method retrieves the oldest unused post from the database, ordered
   * by creation time to ensure fair distribution of content. It transforms
   * the database row into a proper Post object with correct data types.
   * 
   * @returns Promise<Post | null> - The next available post or null if none available
   * @throws Error if database query fails
   */
  async getNextPost(): Promise<Post | null> {
    try {
      // Query for the oldest unused post for this bot
      const post = await this.db.get(`
        SELECT * FROM posts 
        WHERE bot_id = ? AND used = 0 
        ORDER BY created_at ASC 
        LIMIT 1
      `, [this.botId]);

      if (!post) {
        return null;
      }

      // Transform database row to Post object with proper types
      return {
        id: post.id,
        content: post.content,
        bot_id: post.bot_id,
        category: post.category,
        used: Boolean(post.used),
        used_at: post.used_at ? new Date(post.used_at) : undefined,
        created_at: new Date(post.created_at),
        updated_at: new Date(post.updated_at),
        generation_cost: post.generation_cost,
        generation_tokens: post.generation_tokens,
        generation_model: post.generation_model
      };
    } catch (error) {
      logger.error('Failed to get next post:', error);
      throw error;
    }
  }

  /**
   * Mark Post as Used - Update post status after successful posting
   * 
   * This method marks a post as used in the database, recording the timestamp
   * when it was posted. This prevents the same post from being used again
   * and provides audit trail for post usage.
   * 
   * @param postId - The ID of the post to mark as used
   * @param tweetId - Optional Twitter tweet ID for reference
   * @throws Error if database update fails
   */
  async markPostAsUsed(postId: number, tweetId?: string): Promise<void> {
    try {
      // Update post status to used with current timestamp
      await this.db.run(`
        UPDATE posts 
        SET used = 1, used_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND bot_id = ?
      `, [postId, this.botId]);

      logger.info(`Marked post ${postId} as used with tweet ID: ${tweetId}`);
    } catch (error) {
      logger.error('Failed to mark post as used:', error);
      throw error;
    }
  }

  /**
   * Store Posts - Store multiple generated posts with uniqueness checking
   * 
   * This method stores a batch of generated posts in the database, ensuring
   * no duplicate content is stored. It uses content hashing to detect duplicates
   * and only stores unique posts to maintain content quality.
   * 
   * @param posts - Array of generated posts to store
   * @throws Error if database transaction fails
   */
  async storePosts(posts: PostGenerationResult[]): Promise<void> {
    try {
      logger.info(`Storing ${posts.length} posts in database...`);

      // Use transaction to ensure data integrity
      await this.db.transaction(async (db) => {
        for (const post of posts) {
          // Generate content hash for uniqueness checking
          const contentHash = this.generateContentHash(post.content);
          
          // Check if content already exists to prevent duplicates
          const existing = await db.get(`
            SELECT id FROM posts 
            WHERE bot_id = ? AND content_hash = ?
          `, [this.botId, contentHash]);

          if (!existing) {
            // Insert new post with all metadata
            await db.run(`
              INSERT INTO posts (
                content, bot_id, used, created_at, updated_at,
                generation_cost, generation_tokens, generation_model, content_hash
              ) VALUES (?, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?, ?, ?, ?)
            `, [
              post.content,
              this.botId,
              post.cost,
              post.tokens_used,
              post.model,
              contentHash
            ]);
          } else {
            logger.debug(`Skipping duplicate post with hash: ${contentHash}`);
          }
        }
      });

      logger.info(`Successfully stored posts in database`);
    } catch (error) {
      logger.error('Failed to store posts:', error);
      throw error;
    }
  }

  /**
   * Get Post Count - Get statistics about posts for this bot
   * 
   * This method retrieves comprehensive statistics about posts including
   * total count, used count, and remaining count for monitoring and
   * decision making about content generation.
   * 
   * @returns Promise<{total: number, used: number, remaining: number}> - Post statistics
   * @throws Error if database query fails
   */
  async getPostCount(): Promise<{total: number, used: number, remaining: number}> {
    try {
      // Get total post count
      const totalResult = await this.db.get(`
        SELECT COUNT(*) as count FROM posts WHERE bot_id = ?
      `, [this.botId]);

      // Get used post count
      const usedResult = await this.db.get(`
        SELECT COUNT(*) as count FROM posts WHERE bot_id = ? AND used = 1
      `, [this.botId]);

      const total = totalResult.count;
      const used = usedResult.count;
      const remaining = total - used;

      return { total, used, remaining };
    } catch (error) {
      logger.error('Failed to get post count:', error);
      throw error;
    }
  }

  /**
   * Get Bot Statistics - Get comprehensive bot statistics from database
   * 
   * This method retrieves bot statistics including post counts, last post time,
   * and other metrics for health monitoring and reporting.
   * 
   * @returns Promise<any> - Bot statistics object
   * @throws Error if database query fails
   */
  async getBotStats(): Promise<any> {
    try {
      const stats = await this.db.get(`
        SELECT * FROM bot_stats WHERE bot_id = ?
      `, [this.botId]);

      return stats;
    } catch (error) {
      logger.error('Failed to get bot stats:', error);
      throw error;
    }
  }

  /**
   * Get Post History - Get recent post history for monitoring
   * 
   * This method retrieves recent post history including both used and unused
   * posts for monitoring, debugging, and content quality assessment.
   * 
   * @param limit - Maximum number of posts to retrieve (default: 10)
   * @returns Promise<Post[]> - Array of recent posts
   * @throws Error if database query fails
   */
  async getPostHistory(limit: number = 10): Promise<Post[]> {
    try {
      const posts = await this.db.all(`
        SELECT * FROM posts 
        WHERE bot_id = ? 
        ORDER BY created_at DESC 
        LIMIT ?
      `, [this.botId, limit]);

      return posts.map(post => ({
        id: post.id,
        content: post.content,
        bot_id: post.bot_id,
        category: post.category,
        used: Boolean(post.used),
        used_at: post.used_at ? new Date(post.used_at) : undefined,
        created_at: new Date(post.created_at),
        updated_at: new Date(post.updated_at),
        generation_cost: post.generation_cost,
        generation_tokens: post.generation_tokens,
        generation_model: post.generation_model
      }));
    } catch (error) {
      logger.error('Failed to get post history:', error);
      throw error;
    }
  }

  /**
   * Get Posts by Category - Retrieve posts for a specific category
   * 
   * This method retrieves posts for a given category, ordered by creation
   * time, and limits the results to a specified number.
   * 
   * @param category - The category to filter by
   * @param limit - Maximum number of posts to retrieve (default: 50)
   * @returns Promise<Post[]> - Array of posts for the category
   * @throws Error if database query fails
   */
  async getPostsByCategory(category: string, limit: number = 50): Promise<Post[]> {
    try {
      const posts = await this.db.all(`
        SELECT * FROM posts 
        WHERE bot_id = ? AND category = ? AND used = 0
        ORDER BY created_at ASC 
        LIMIT ?
      `, [this.botId, category, limit]);

      return posts.map(post => ({
        id: post.id,
        content: post.content,
        bot_id: post.bot_id,
        category: post.category,
        used: Boolean(post.used),
        used_at: post.used_at ? new Date(post.used_at) : undefined,
        created_at: new Date(post.created_at),
        updated_at: new Date(post.updated_at),
        generation_cost: post.generation_cost,
        generation_tokens: post.generation_tokens,
        generation_model: post.generation_model
      }));
    } catch (error) {
      logger.error('Failed to get posts by category:', error);
      throw error;
    }
  }

  /**
   * Delete Post - Remove a specific post from the database
   * 
   * This method deletes a post from the database based on its ID and bot ID.
   * It's primarily used for cleanup or when a post is no longer needed.
   * 
   * @param postId - The ID of the post to delete
   * @throws Error if database deletion fails
   */
  async deletePost(postId: number): Promise<void> {
    try {
      await this.db.run(`
        DELETE FROM posts 
        WHERE id = ? AND bot_id = ?
      `, [postId, this.botId]);

      logger.info(`Deleted post ${postId}`);
    } catch (error) {
      logger.error('Failed to delete post:', error);
      throw error;
    }
  }

  /**
   * Cleanup Old Posts - Remove posts that have been used for a long time
   * 
   * This method deletes posts that have been marked as used for more than
   * a specified number of days. This helps maintain a clean database and
   * prevent excessive storage usage.
   * 
   * @param daysOld - Number of days after which unused posts are considered old (default: 30)
   * @returns Promise<number> - Number of posts deleted
   * @throws Error if database cleanup fails
   */
  async cleanupOldPosts(daysOld: number = 30): Promise<number> {
    try {
      const result = await this.db.run(`
        DELETE FROM posts 
        WHERE bot_id = ? AND used = 1 AND created_at < datetime('now', '-${daysOld} days')
      `, [this.botId]);

      const deletedCount = result.changes || 0;
      logger.info(`Cleaned up ${deletedCount} old posts`);
      return deletedCount;
    } catch (error) {
      logger.error('Failed to cleanup old posts:', error);
      throw error;
    }
  }

  /**
   * Generate Content Hash - Create SHA-256 hash of post content
   * 
   * This method generates a SHA-256 hash of the post content to enable
   * efficient duplicate detection and content uniqueness validation.
   * 
   * @param content - The post content to hash
   * @returns string - SHA-256 hash of the content
   */
  private generateContentHash(content: string): string {
    return createHash('sha256').update(content.toLowerCase().trim()).digest('hex');
  }
}
