import { DatabaseConnection } from '../../shared/database/connection';
import { logger } from '../../utils/logger';
import { TemplatePostGenerator } from './post-generator';

export class DatabaseSeeder {
  private botId: string;

  constructor(private db: DatabaseConnection) {
    this.botId = process.env.BOT_NAME || 'template-bot';
  }

  // Seed the database with all 2,016 posts
  async seedAllPosts(): Promise<void> {
    try {
      logger.info('Starting database seeding with all posts...');

      // Check if posts already exist
      const existingCount = await this.getExistingPostCount();
      if (existingCount > 0) {
        logger.info(`Database already contains ${existingCount} posts. Skipping seeding.`);
        return;
      }

      // Generate all posts
      const allPosts = TemplatePostGenerator.generateAllPosts();
      logger.info(`Generated ${allPosts.length} posts for seeding`);

      // Store posts in database
      await this.storePostsInDatabase(allPosts);

      // Update bot stats
      await this.updateBotStats(allPosts.length);

      logger.info('Database seeding completed successfully');
    } catch (error) {
      logger.error('Failed to seed database:', error);
      throw error;
    }
  }

  // Seed posts for a specific topic
  async seedTopicPosts(topic: string, count: number = 63): Promise<void> {
    try {
      logger.info(`Seeding ${count} posts for topic: ${topic}`);

      // Generate posts for the topic
      const topicPosts = TemplatePostGenerator.generateTopicPosts(topic, count);

      // Store posts in database
      await this.storePostsInDatabase(topicPosts);

      // Update bot stats
      await this.updateBotStats(topicPosts.length);

      logger.info(`Successfully seeded ${topicPosts.length} posts for topic: ${topic}`);
    } catch (error) {
      logger.error(`Failed to seed posts for topic ${topic}:`, error);
      throw error;
    }
  }

  // Seed additional unique posts to expand the database
  async seedAdditionalPosts(count: number = 400): Promise<void> {
    try {
      logger.info(`Seeding ${count} additional unique posts...`);

      // Generate additional posts
      const additionalPosts = TemplatePostGenerator.generateAdditionalPosts(count);

      // Store posts in database
      await this.storePostsInDatabase(additionalPosts);

      // Update bot stats
      await this.updateBotStats(additionalPosts.length);

      logger.info(`Successfully seeded ${additionalPosts.length} additional posts`);
    } catch (error) {
      logger.error(`Failed to seed additional posts:`, error);
      throw error;
    }
  }

  // Store posts in database with uniqueness checking
  private async storePostsInDatabase(posts: any[]): Promise<void> {
    try {
      logger.info(`Storing ${posts.length} posts in database...`);

      let storedCount = 0;
      let duplicateCount = 0;

      await this.db.transaction(async (db) => {
        for (const post of posts) {
          const contentHash = TemplatePostGenerator.generateContentHash(post.content);
          
          // Check if content already exists
          const existing = await db.get(`
            SELECT id FROM posts 
            WHERE bot_id = ? AND content_hash = ?
          `, [this.botId, contentHash]);

          if (!existing) {
            await db.run(`
              INSERT INTO posts (
                content, bot_id, category, used, created_at, updated_at,
                generation_cost, generation_tokens, generation_model, content_hash
              ) VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?, ?, ?, ?)
            `, [
              post.content,
              this.botId,
              post.category || 'general',
              post.cost,
              post.tokens_used,
              post.model,
              contentHash
            ]);
            storedCount++;
          } else {
            duplicateCount++;
          }
        }
      });

      logger.info(`Stored ${storedCount} new posts, skipped ${duplicateCount} duplicates`);
    } catch (error) {
      logger.error('Failed to store posts in database:', error);
      throw error;
    }
  }

  // Get count of existing posts
  private async getExistingPostCount(): Promise<number> {
    try {
      const result = await this.db.get(`
        SELECT COUNT(*) as count 
        FROM posts 
        WHERE bot_id = ?
      `, [this.botId]);

      return result?.count || 0;
    } catch (error) {
      logger.error('Failed to get existing post count:', error);
      return 0;
    }
  }

  // Update bot stats after seeding
  private async updateBotStats(postCount: number): Promise<void> {
    try {
      await this.db.run(`
        UPDATE bot_stats 
        SET total_posts = total_posts + ?, 
            remaining_posts = remaining_posts + ?,
            last_replenishment_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE bot_id = ?
      `, [postCount, postCount, this.botId]);

      logger.info(`Updated bot stats with ${postCount} new posts`);
    } catch (error) {
      logger.error('Failed to update bot stats:', error);
      throw error;
    }
  }

  // Get seeding statistics
  async getSeedingStats(): Promise<{
    totalPosts: number;
    usedPosts: number;
    remainingPosts: number;
    topics: { [key: string]: number };
  }> {
    try {
      // Get overall stats
      const stats = await this.db.get(`
        SELECT total_posts, used_posts, remaining_posts
        FROM bot_stats 
        WHERE bot_id = ?
      `, [this.botId]);

      // Get topic distribution
      const topicStats = await this.db.all(`
        SELECT category, COUNT(*) as count
        FROM posts 
        WHERE bot_id = ?
        GROUP BY category
      `, [this.botId]);

      const topics: { [key: string]: number } = {};
      for (const topic of topicStats) {
        topics[topic.category] = topic.count;
      }

      return {
        totalPosts: stats?.total_posts || 0,
        usedPosts: stats?.used_posts || 0,
        remainingPosts: stats?.remaining_posts || 0,
        topics
      };
    } catch (error) {
      logger.error('Failed to get seeding stats:', error);
      throw error;
    }
  }

  // Clear all posts (for testing/reset)
  async clearAllPosts(): Promise<void> {
    try {
      logger.info('Clearing all posts from database...');

      await this.db.run(`
        DELETE FROM posts WHERE bot_id = ?
      `, [this.botId]);

      await this.db.run(`
        UPDATE bot_stats 
        SET total_posts = 0, used_posts = 0, remaining_posts = 0,
            updated_at = CURRENT_TIMESTAMP
        WHERE bot_id = ?
      `, [this.botId]);

      logger.info('All posts cleared from database');
    } catch (error) {
      logger.error('Failed to clear posts:', error);
      throw error;
    }
  }
}
