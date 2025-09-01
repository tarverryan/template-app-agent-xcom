/**
 * Main Application Entry Point - X.com Bot Template
 *
 * This is the main entry point for the X.com Bot Template application.
 * It handles application startup, shutdown, and process management.
 * 
 * Key Responsibilities:
 * - Load environment configuration
 * - Initialize database connection
 * - Start bot engine and health server
 * - Handle graceful shutdown
 * - Manage process signals and error handling
 * 
 * @author Your Name
 * @version 1.0.0
 */

import dotenv from 'dotenv';
import { initializeDatabase } from './shared/database/connection';
import { TemplateBot } from './bot';
import { HealthServer } from './health';
import { logger } from './utils/logger';

// Load environment variables from .env file
dotenv.config();

// Global variables for graceful shutdown
let bot: TemplateBot | null = null;
let healthServer: HealthServer | null = null;

/**
 * Initialize Application - Set up all components and start services
 * 
 * This function performs the complete application initialization:
 * 1. Load and validate environment variables
 * 2. Initialize database connection
 * 3. Create and initialize bot instance
 * 4. Start health monitoring server
 * 5. Set up process signal handlers
 * 
 * @throws Error if any component fails to initialize
 */
async function initializeApp(): Promise<void> {
  try {
    logger.info('Starting X.com Bot Template application...');

    // Step 1: Validate required environment variables
    validateEnvironment();

    // Step 2: Initialize database connection
          const dbPath = process.env.DATABASE_PATH || './data/template-bot.db';
    logger.info(`Initializing database at: ${dbPath}`);
    const db = await initializeDatabase(dbPath);

    // Step 3: Create and initialize bot instance
          logger.info('Initializing Template Bot...');
      bot = new TemplateBot(db);
    await bot.initialize();

    // Step 4: Create and start health server
    logger.info('Starting health monitoring server...');
    healthServer = new HealthServer(bot);
    await healthServer.start();

    logger.info('Application initialized successfully');
    logger.info(`Health endpoint available at: http://localhost:${process.env.HEALTH_PORT || 3000}/health`);

  } catch (error) {
    logger.error('Failed to initialize application:', error);
    process.exit(1);
  }
}

/**
 * Validate Environment - Check required environment variables
 * 
 * This function validates that all required environment variables are set.
 * It provides helpful error messages if any are missing.
 * 
 * @throws Error if required environment variables are missing
 */
function validateEnvironment(): void {
  const requiredEnvVars = [
    'BOT_NAME',
    'TWITTER_API_KEY',
    'TWITTER_API_SECRET',
    'TWITTER_ACCESS_TOKEN',
    'TWITTER_ACCESS_SECRET'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  logger.info('Environment validation passed');
}

/**
 * Graceful Shutdown - Clean shutdown of all services
 * 
 * This function performs a graceful shutdown of the application:
 * 1. Stop the health server
 * 2. Shutdown the bot
 * 3. Close database connections
 * 4. Exit the process
 * 
 * @param signal - The signal that triggered the shutdown
 */
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, starting graceful shutdown...`);

  try {
    // Step 1: Stop health server if running
    if (healthServer) {
      logger.info('Stopping health server...');
      await healthServer.stop();
    }

    // Step 2: Shutdown bot if running
    if (bot) {
      logger.info('Shutting down bot...');
      await bot.shutdown();
    }

    logger.info('Graceful shutdown completed');
    process.exit(0);

  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
}

/**
 * Handle Uncaught Exceptions - Global error handler
 * 
 * This function handles any uncaught exceptions in the application.
 * It logs the error and performs a graceful shutdown.
 * 
 * @param error - The uncaught error
 */
function handleUncaughtException(error: Error): void {
  logger.error('Uncaught exception:', error);
  gracefulShutdown('uncaught exception');
}

/**
 * Handle Unhandled Promise Rejections - Global promise rejection handler
 * 
 * This function handles any unhandled promise rejections in the application.
 * It logs the error and performs a graceful shutdown.
 * 
 * @param reason - The rejection reason
 * @param promise - The rejected promise
 */
function handleUnhandledRejection(reason: any, promise: Promise<any>): void {
  logger.error('Unhandled promise rejection:', { reason, promise });
  gracefulShutdown('unhandled promise rejection');
}

// Set up process signal handlers for graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Set up global error handlers
process.on('uncaughtException', handleUncaughtException);
process.on('unhandledRejection', handleUnhandledRejection);

// Start the application
initializeApp().catch((error) => {
  logger.error('Failed to start application:', error);
  process.exit(1);
});
