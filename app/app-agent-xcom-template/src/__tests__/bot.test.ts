import { TemplateBot } from '../bot';
import { DatabaseConnection, initializeDatabase } from '../shared/database/connection';

// Mock external dependencies
jest.mock('../services/twitter');
jest.mock('../services/openai');
jest.mock('../utils/logger');

describe('TemplateBot', () => {
  let bot: TemplateBot;
  let db: DatabaseConnection;

  beforeAll(async () => {
    // Initialize test database
    db = await initializeDatabase(':memory:');
  });

  beforeEach(async () => {
    // Create fresh bot instance for each test
    bot = new TemplateBot(db);
  });

  afterEach(async () => {
    // Clean up after each test
    await bot.shutdown();
  });

  afterAll(async () => {
    // Clean up database
    await db.close();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await expect(bot.initialize()).resolves.not.toThrow();
    });

    it('should set isInitialized flag', async () => {
      await bot.initialize();
      expect(bot['isInitialized']).toBe(true);
    });

    it('should schedule daily posts', async () => {
      await bot.initialize();
      expect(bot['cronJob']).toBeDefined();
    });
  });

  describe('manual post', () => {
    beforeEach(async () => {
      await bot.initialize();
    });

    it('should execute manual post successfully', async () => {
      await expect(bot.manualPost()).resolves.not.toThrow();
    });

    it('should throw error if not initialized', async () => {
      const uninitializedBot = new TemplateBot(db);
      await expect(uninitializedBot.manualPost()).rejects.toThrow('Bot not initialized');
    });
  });

  describe('status', () => {
    beforeEach(async () => {
      await bot.initialize();
    });

    it('should return bot status', async () => {
      const status = await bot.getStatus();
      
      expect(status).toHaveProperty('isInitialized');
      expect(status).toHaveProperty('remainingPosts');
      expect(status.isInitialized).toBe(true);
    });
  });

  describe('shutdown', () => {
    beforeEach(async () => {
      await bot.initialize();
    });

    it('should shutdown gracefully', async () => {
      await expect(bot.shutdown()).resolves.not.toThrow();
    });

    it('should stop cron job', async () => {
      const cronJob = bot['cronJob'];
      await bot.shutdown();
      expect(cronJob?.stop).toHaveBeenCalled();
    });
  });
});
