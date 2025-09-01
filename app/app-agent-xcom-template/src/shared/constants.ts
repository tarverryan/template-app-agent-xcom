// API Constants
export const TWITTER_API_BASE_URL = 'https://api.twitter.com/2';
export const OPENAI_API_BASE_URL = 'https://api.openai.com/v1';

// Rate Limits
export const TWITTER_RATE_LIMIT_POSTS_PER_15MIN = 300;
export const TWITTER_RATE_LIMIT_POSTS_PER_DAY = 2400;
export const OPENAI_RATE_LIMIT_REQUESTS_PER_MINUTE = 60;

// Content Limits
export const MAX_TWEET_LENGTH = 280;
export const MAX_HASHTAGS_PER_TWEET = 5;
export const MAX_URLS_PER_TWEET = 2;

// Cost Limits
export const MAX_COST_PER_POST_GENERATION = 0.50;
export const MAX_TOKENS_PER_POST_GENERATION = 1000;

// Database Constants
export const DEFAULT_BATCH_SIZE = 2000;
export const DEFAULT_REPLENISHMENT_THRESHOLD = 50;
export const MAX_RETRIES = 3;
export const DEFAULT_RETRY_DELAY_MS = 5000;

// Time Constants
export const ONE_MINUTE_MS = 60 * 1000;
export const ONE_HOUR_MS = 60 * 60 * 1000;
export const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// Error Messages
export const ERROR_MESSAGES = {
  DATABASE_CONNECTION_FAILED: 'Failed to connect to database',
  TWITTER_API_ERROR: 'Twitter API request failed',
  OPENAI_API_ERROR: 'OpenAI API request failed',
  INVALID_CONTENT: 'Content validation failed',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
  COST_LIMIT_EXCEEDED: 'Cost limit exceeded',
  NO_AVAILABLE_POSTS: 'No available posts found',
  POST_GENERATION_FAILED: 'Failed to generate posts',
  BOT_NOT_INITIALIZED: 'Bot not initialized',
  INVALID_CONFIGURATION: 'Invalid configuration'
} as const;

// Log Levels
export const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
} as const;

// Bot Status
export const BOT_STATUS = {
  HEALTHY: 'healthy',
  WARNING: 'warning',
  ERROR: 'error'
} as const;

// Content Categories
export const CONTENT_CATEGORIES = {
  BATTLE_WISDOM: 'battle_wisdom',
  NORTHERN_PHILOSOPHY: 'northern_philosophy',
  BLOODY_NINE_REFLECTION: 'bloody_nine_reflection',
  FRIENDSHIP_LOYALTY: 'friendship_loyalty',
  SURVIVAL_LESSONS: 'survival_lessons',
  VIOLENCE_CONSEQUENCES: 'violence_consequences',
  REDEMPTION_THOUGHTS: 'redemption_thoughts',
  WAR_EXPERIENCE: 'war_experience'
} as const;

// Timezones
export const TIMEZONES = {
  MST: 'America/Denver',
  PST: 'America/Los_Angeles',
  EST: 'America/New_York',
  UTC: 'UTC'
} as const;

// Cron Schedules
export const CRON_SCHEDULES = {
  DAILY_9AM_MST: '0 9 * * *',
  DAILY_10AM_MST: '0 10 * * *',
  DAILY_11AM_MST: '0 11 * * *',
  DAILY_12PM_MST: '0 12 * * *',
  DAILY_1PM_MST: '0 13 * * *',
  DAILY_2PM_MST: '0 14 * * *'
} as const;
