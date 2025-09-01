/**
 * X.com Bot Template - Main Bot Engine
 *
 * This is the core bot engine that manages the X.com bot template.
 * It handles scheduling, posting, content generation, and all bot operations.
 * 
 * Key Responsibilities:
 * - Initialize all bot services (Twitter, OpenAI, Database)
 * - Schedule daily posts at 9am MST
 * - Manage post content and generation
 * - Handle error recovery and retry logic
 * - Provide health monitoring and statistics
 * 
 * @author Your Name
 * @version 1.0.0
 */

import cron from 'node-cron';
import { DatabaseConnection } from './shared/database/connection';
import { logger } from './utils/logger';
import { TemplatePostManager } from './services/post-manager';
import { TemplateTwitterService } from './services/twitter';
import { TemplateOpenAIService } from './services/openai';
import { personalityConfig } from './config/personality';
import { DatabaseSeeder } from './services/generator/database-seeder';
import { TemplatePostGenerator } from './services/generator/post-generator';

/**
 * Main Bot Class - X.com Bot Template
 * 
 * This class orchestrates all bot operations including:
 * - Service initialization and management
 * - Scheduled posting via cron jobs
 * - Content generation and management
 * - Error handling and recovery
 * - Health monitoring and statistics
 */
export class TemplateBot {
  // Core service instances
  private postManager: TemplatePostManager;        // Manages post content and database operations
  private twitterService: TemplateTwitterService;  // Handles Twitter API interactions
  private openaiService: TemplateOpenAIService;    // Manages OpenAI API for content generation
  private cronJob: cron.ScheduledTask | null = null;  // Cron job for scheduled posting
  private isInitialized = false;                // Tracks bot initialization status

  /**
   * Constructor - Initialize bot with database connection
   * 
   * @param db - Database connection instance for persistent storage
   */
  constructor(private db: DatabaseConnection) {
    // Initialize service instances with database connection
    this.postManager = new TemplatePostManager(db);
    this.twitterService = new TemplateTwitterService();
    this.openaiService = new TemplateOpenAIService();
  }

  /**
   * Initialize Bot - Set up all services and start scheduling
   * 
   * This method performs the following initialization steps:
   * 1. Initialize post manager for content handling
   * 2. Initialize Twitter service for posting
   * 3. Initialize OpenAI service (optional, for local generation)
   * 4. Set up bot configuration in database
   * 5. Schedule daily posting
   * 6. Check and generate initial posts if needed
   * 
   * @throws Error if any service fails to initialize
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing X.com Bot Template...');

      // Step 1: Initialize core services
      await this.postManager.initialize();
      await this.twitterService.initialize();
      
      // Step 2: Initialize OpenAI service (optional for local generation)
      try {
        await this.openaiService.initialize();
        logger.info('OpenAI service initialized (for local generation)');
      } catch (error) {
        logger.warn('OpenAI service initialization failed, continuing with local posts only:', error);
        // Continue without OpenAI - we'll use local generation
      }

      // Step 3: Set up bot configuration in database
      await this.setupBotConfig();

      // Step 4: Schedule daily posting at 9am MST
      this.schedulePosting();

      // Step 5: Check if we need to generate initial posts
      await this.checkAndGeneratePosts();

      // Mark bot as fully initialized
      this.isInitialized = true;
      logger.info('X.com Bot Template initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Template Bot:', error);
      throw error;
    }
  }

  /**
   * Setup Bot Configuration - Create or update bot configuration in database
   * 
   * This method ensures the bot has proper configuration stored in the database,
   * including personality settings, posting schedule, and statistics tracking.
   */
  private async setupBotConfig(): Promise<void> {
    try {
      const botId = process.env.BOT_NAME || 'template-bot';
      
      // Check if bot config already exists in database
      const existingConfig = await this.db.get(
        'SELECT * FROM bot_configs WHERE bot_id = ?',
        [botId]
      );

      if (!existingConfig) {
        // Insert new bot configuration with personality settings
        await this.db.run(`
          INSERT INTO bot_configs (
            bot_id, personality_prompt, content_sources, posting_style, 
            topics, tone, max_length, schedule_cron, timezone
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          botId,
          personalityConfig.voice,
          JSON.stringify(personalityConfig.topics),
          personalityConfig.writingStyle,
          JSON.stringify(personalityConfig.topics),
          personalityConfig.tone,
          personalityConfig.postLength.max,
          process.env.BOT_SCHEDULE || '0 9 * * *',
          process.env.TIMEZONE || 'America/Denver'
        ]);

        logger.info('Bot configuration created in database');
      }

      // Initialize bot statistics if not exists
      const existingStats = await this.db.get(
        'SELECT * FROM bot_stats WHERE bot_id = ?',
        [botId]
      );

      if (!existingStats) {
        await this.db.run(`
          INSERT INTO bot_stats (bot_id) VALUES (?)
        `, [botId]);
        logger.info('Bot stats initialized');
      }
    } catch (error) {
      logger.error('Failed to setup bot configuration:', error);
      throw error;
    }
  }

  /**
   * Schedule Posting - Set up cron job for daily posting
   * 
   * This method creates a cron job that triggers daily posting at 9am MST.
   * The schedule can be configured via environment variables.
   */
  private schedulePosting(): void {
    // Use environment variable for schedule, fallback to 9:00 AM MDT
    // Cron format: minute hour day month day-of-week
    // 0 15 * * * = 3:00 PM UTC = 9:00 AM MDT
    const schedule = process.env.BOT_SCHEDULE || '0 15 * * *';

    logger.info(`Scheduling daily posts for ${schedule} UTC (9:00 AM MDT)`);

    // Create cron job that executes daily at the specified time
    this.cronJob = cron.schedule(schedule, async () => {
      try {
        logger.info('Executing scheduled post at 9:00 AM MDT...');
        await this.executePost();
      } catch (error) {
        logger.error('Failed to execute scheduled post:', error);
      }
    }, {
      scheduled: true  // Start the job immediately
    });

    logger.info('Daily posting scheduled successfully for 9:00 AM MDT');
  }

  /**
   * Execute Post - Main posting logic with retry mechanism
   * 
   * This method handles the complete posting workflow:
   * 1. Get next available post from database
   * 2. Post to Twitter with retry logic
   * 3. Mark post as used if successful
   * 4. Check if more posts need to be generated
   * 
   * @throws Error if posting fails after all retries
   */
  async executePost(): Promise<void> {
    try {
      logger.info('Starting post execution...');

      // Step 1: Get next available post from database
      const post = await this.postManager.getNextPost();
      if (!post) {
        logger.warn('No available posts found, generating new batch...');
        await this.generatePosts();
        return;
      }

      // Step 2: Post to Twitter with retry logic
      const result = await this.postWithRetry(post.content);
      
      if (result.success) {
        // Step 3: Mark post as used in database
        await this.postManager.markPostAsUsed(post.id, result.tweet_id);
        logger.info(`Successfully posted tweet: ${result.tweet_id}`);
      } else {
        logger.error(`Failed to post after retries: ${result.error}`);
      }

      // Step 4: Check if we need to generate more posts
      await this.checkAndGeneratePosts();

    } catch (error) {
      logger.error('Error during post execution:', error);
      throw error;
    }
  }

  /**
   * Post With Retry - Post to Twitter with automatic retry logic
   * 
   * This method implements a robust retry mechanism for posting to Twitter:
   * - Configurable number of retry attempts
   * - Exponential backoff between retries
   * - Comprehensive error logging
   * - Success/failure tracking in database
   * 
   * @param content - The tweet content to post
   * @returns Object with success status and tweet ID or error message
   */
  private async postWithRetry(content: string): Promise<{ success: boolean; tweet_id?: string; error?: string }> {
    const maxRetries = parseInt(process.env.MAX_RETRIES || '3');
    const retryDelay = parseInt(process.env.RETRY_DELAY_MS || '5000');

    // Try posting up to maxRetries times
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info(`Posting attempt ${attempt}/${maxRetries}`);
        
        // Record start time for performance tracking
        const startTime = Date.now();
        const tweetId = await this.twitterService.postTweet(content);
        const responseTime = Date.now() - startTime;

        // Log successful post to database for analytics
        await this.db.run(`
          INSERT INTO post_logs (bot_id, success, tweet_id, response_time_ms)
          VALUES (?, ?, ?, ?)
        `, [process.env.BOT_NAME, true, tweetId, responseTime]);

        return { success: true, tweet_id: tweetId };

      } catch (error) {
        logger.warn(`Post attempt ${attempt} failed:`, error);

        // Log failed attempt to database for debugging
        await this.db.run(`
          INSERT INTO post_logs (bot_id, attempt_number, success, error_message)
          VALUES (?, ?, ?, ?)
        `, [process.env.BOT_NAME, attempt, false, error instanceof Error ? error.message : String(error)]);

        // If this was the last attempt, return failure
        if (attempt === maxRetries) {
          return { success: false, error: error instanceof Error ? error.message : String(error) };
        }

        // Wait before retry (exponential backoff could be implemented here)
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

    return { success: false, error: 'Max retries exceeded' };
  }

  /**
   * Check And Generate Posts - Monitor post count and generate more if needed
   * 
   * This method ensures the bot always has sufficient posts available:
   * - Checks remaining post count in database
   * - Triggers generation if count falls below threshold
   * - Uses configurable threshold from environment variables
   */
  private async checkAndGeneratePosts(): Promise<void> {
    try {
      const postCount = await this.postManager.getPostCount();
      const remainingPosts = postCount.remaining;
      const threshold = parseInt(process.env.REPLENISHMENT_THRESHOLD || '50');

      if (remainingPosts <= threshold) {
        logger.info(`Remaining posts (${remainingPosts}) below threshold (${threshold}), generating new batch...`);
        await this.generatePosts();
      } else {
        logger.info(`Sufficient posts remaining: ${remainingPosts}`);
      }
    } catch (error) {
      logger.error('Error checking post count:', error);
    }
  }

  /**
   * Generate Posts - Create new posts using local generator
   * 
   * This method generates new posts using the local post generator instead of
   * OpenAI API to reduce costs and improve reliability. It generates posts
   * in batches and stores them in the database.
   * 
   * @throws Error if post generation fails
   */
  private async generatePosts(): Promise<void> {
    try {
      const batchSize = parseInt(process.env.POSTS_BATCH_SIZE || '2016');
      logger.info(`Generating ${batchSize} new posts using local generator...`);

      // Use local post generator instead of OpenAI API for cost efficiency
              const { TemplatePostGenerator } = await import('./services/generator/post-generator');
        const posts = TemplatePostGenerator.generateAllPosts();
      
      // Store generated posts in database
      await this.postManager.storePosts(posts);

      // Update bot statistics with new post count
      const botId = process.env.BOT_NAME || 'template-bot';
      await this.db.run(`
        UPDATE bot_stats 
        SET total_posts = total_posts + ?, 
            remaining_posts = remaining_posts + ?,
            last_replenishment_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE bot_id = ?
      `, [posts.length, posts.length, botId]);

      logger.info(`Successfully generated and stored ${posts.length} posts using local generator`);
    } catch (error) {
      logger.error('Failed to generate posts:', error);
      throw error;
    }
  }

  /**
   * Shutdown Bot - Clean shutdown of all services
   * 
   * This method performs a graceful shutdown:
   * - Stops the cron job
   * - Closes database connections
   * - Logs shutdown completion
   */
  async shutdown(): Promise<void> {
    try {
      logger.info('Shutting down X.com Bot Template...');

      // Stop the cron job if it's running
      if (this.cronJob) {
        this.cronJob.stop();
        logger.info('Cron job stopped');
      }

      // Close database connection
      await this.db.close();
      logger.info('Database connection closed');

      logger.info('X.com Bot Template shutdown complete');
    } catch (error) {
      logger.error('Error during shutdown:', error);
    }
  }

  /**
   * Manual Post - Trigger a post manually (for testing)
   * 
   * This method allows manual triggering of a post, bypassing the schedule.
   * Useful for testing and emergency posting.
   * 
   * @throws Error if bot is not initialized
   */
  async manualPost(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Bot not initialized');
    }
    await this.executePost();
  }

  /**
   * Get Status - Return current bot status and statistics
   * 
   * This method provides comprehensive status information including:
   * - Initialization status
   * - Remaining post count
   * - Last post timestamp
   * - Last replenishment timestamp
   * 
   * @returns Object with bot status information
   */
  async getStatus(): Promise<{
    isInitialized: boolean;
    remainingPosts: number;
    lastPostAt?: Date;
    lastReplenishmentAt?: Date;
  }> {
    const botId = process.env.BOT_NAME || 'template-bot';
    
    // Query bot statistics from database
    const stats = await this.db.get(`
      SELECT remaining_posts, last_post_at, last_replenishment_at
      FROM bot_stats 
      WHERE bot_id = ?
    `, [botId]);

    return {
      isInitialized: this.isInitialized,
      remainingPosts: stats?.remaining_posts || 0,
      lastPostAt: stats?.last_post_at ? new Date(stats.last_post_at) : undefined,
      lastReplenishmentAt: stats?.last_replenishment_at ? new Date(stats.last_replenishment_at) : undefined
    };
  }
}
