/**
 * Seed Posts Script - Database Seeding Utility
 * 
 * This script provides a command-line interface for seeding the database with
 * generated posts for the X.com Bot Template. It supports various seeding
 * operations including bulk seeding, topic-specific seeding, and database cleanup.
 * 
 * Key Features:
 * - Bulk seeding of all 2,016 posts
 * - Topic-specific seeding with custom counts
 * - Database statistics and monitoring
 * - Database cleanup and maintenance
 * - Comprehensive error handling and logging
 * 
 * Usage Examples:
 * - npm run seed-all     # Seed all 2,016 posts
 * - npm run seed-topic battle_wisdom 63  # Seed 63 posts for battle_wisdom topic
 * - npm run stats        # Show seeding statistics
 * - npm run clear        # Clear all posts from database
 * 
 * @author Your Name
 * @version 1.0.0
 */

import dotenv from 'dotenv';
import { initializeDatabase } from '../shared';
import { DatabaseSeeder } from '../services/generator/database-seeder';
import { logger } from '../utils/logger';

// Load environment variables from .env file
dotenv.config();

/**
 * Main Function - Entry point for the seeding script
 * 
 * This function orchestrates the database seeding process:
 * 1. Initialize database connection
 * 2. Create database seeder instance
 * 3. Parse command line arguments
 * 4. Execute appropriate seeding operation
 * 5. Handle errors and cleanup
 * 
 * Command Line Arguments:
 * - seed-all: Seed all 2,016 posts across all categories
 * - seed-topic <topic> [count]: Seed posts for specific topic with optional count
 * - stats: Display seeding statistics and database information
 * - clear: Remove all posts from the database
 * 
 * @throws Error if seeding operation fails
 */
async function main() {
  try {
    logger.info('Starting post seeding script...');

    // Step 1: Initialize database connection
    const dbPath = process.env.DATABASE_PATH || './data/template-bot.db';
    const db = await initializeDatabase(dbPath);
    logger.info(`Database initialized at: ${dbPath}`);

    // Step 2: Create database seeder instance
    const seeder = new DatabaseSeeder(db);

    // Step 3: Parse command line arguments
    const args = process.argv.slice(2);
    const command = args[0];

    // Step 4: Execute appropriate seeding operation based on command
    switch (command) {
      case 'seed-all':
        logger.info('Executing bulk seeding of all posts...');
        await seeder.seedAllPosts();
        logger.info('Bulk seeding completed successfully');
        break;
      
      case 'seed-additional':
        const additionalCount = parseInt(args[1]) || 400;
        logger.info(`Generating ${additionalCount} additional unique posts...`);
        await seeder.seedAdditionalPosts(additionalCount);
        logger.info(`Additional seeding completed successfully`);
        break;
      
      case 'seed-topic':
        const topic = args[1];
        const count = parseInt(args[2]) || 63; // Default to 63 posts per topic
        
        if (!topic) {
          logger.error('Please specify a topic: npm run seed-topic <topic> [count]');
          logger.info('Available topics: battle_wisdom, life_advice, northern_culture, etc.');
          process.exit(1);
        }
        
        logger.info(`Seeding ${count} posts for topic: ${topic}`);
        await seeder.seedTopicPosts(topic, count);
        logger.info(`Topic seeding completed for: ${topic}`);
        break;
      
      case 'stats':
        logger.info('Retrieving seeding statistics...');
        const stats = await seeder.getSeedingStats();
        logger.info('Seeding Statistics:', stats);
        break;
      
      case 'clear':
        logger.warn('Clearing all posts from database...');
        await seeder.clearAllPosts();
        logger.info('Database cleared successfully');
        break;
      
      default:
        // Display help information if no valid command provided
        logger.info('Available commands:');
        logger.info('  seed-all     - Seed all 2,016 posts across all categories');
        logger.info('  seed-topic   - Seed posts for a specific topic with optional count');
        logger.info('  stats        - Show comprehensive seeding statistics');
        logger.info('  clear        - Clear all posts from the database (DESTRUCTIVE)');
        logger.info('');
        logger.info('Examples:');
        logger.info('  npm run seed-all');
        logger.info('  npm run seed-topic battle_wisdom 63');
        logger.info('  npm run seed-topic life_advice 50');
        logger.info('  npm run stats');
        logger.info('  npm run clear');
        logger.info('');
        logger.info('Available Topics:');
        logger.info('  battle_wisdom, life_advice, northern_culture, friendship,');
        logger.info('  redemption, humor, philosophy, war, peace, death, honor,');
        logger.info('  betrayal, hope, despair, power, weakness, strength, fear,');
        logger.info('  love, hate, justice, injustice, freedom, slavery, wealth,');
        logger.info('  poverty, knowledge, ignorance, truth, lies, faith, doubt');
        break;
    }

    // Step 5: Close database connection and cleanup
    await db.close();
    logger.info('Seeding script completed successfully');

  } catch (error) {
    logger.error('Seeding script failed:', error);
    process.exit(1);
  }
}

/**
 * Handle Uncaught Exceptions - Global error handler for uncaught exceptions
 * 
 * This function catches any uncaught exceptions in the script and logs them
 * before exiting with an error code. This ensures that errors are properly
 * reported and the script doesn't hang on unexpected errors.
 * 
 * @param error - The uncaught exception
 */
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

/**
 * Handle Unhandled Promise Rejections - Global handler for unhandled promise rejections
 * 
 * This function catches any unhandled promise rejections in the script and logs them
 * before exiting with an error code. This ensures that async errors are properly
 * reported and the script doesn't hang on rejected promises.
 * 
 * @param reason - The rejection reason
 * @param promise - The rejected promise
 */
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the script with error handling
main().catch((error) => {
  logger.error('Fatal error during seeding:', error);
  process.exit(1);
});
