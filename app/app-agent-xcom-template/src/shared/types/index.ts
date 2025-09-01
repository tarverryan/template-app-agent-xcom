import { z } from 'zod';

// Environment configuration schema
export const EnvironmentSchema = z.object({
  // Twitter API v2 credentials
  TWITTER_API_KEY: z.string().min(1),
  TWITTER_API_SECRET: z.string().min(1),
  TWITTER_ACCESS_TOKEN: z.string().min(1),
  TWITTER_ACCESS_SECRET: z.string().min(1),
  
  // OpenAI configuration
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_MODEL: z.string().default('gpt-4'),
  
  // Database configuration
  DATABASE_PATH: z.string().default('./data/bot.db'),
  
  // Bot configuration
  BOT_NAME: z.string().min(1),
  BOT_PERSONALITY: z.string().min(1),
  BOT_SCHEDULE: z.string().default('0 9 * * *'), // 9am MST default
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  
  // Content generation
  POSTS_BATCH_SIZE: z.string().transform((val: string) => parseInt(val, 10)).default('2000'),
  REPLENISHMENT_THRESHOLD: z.string().transform((val: string) => parseInt(val, 10)).default('50'),
  
  // Retry configuration
  MAX_RETRIES: z.string().transform((val: string) => parseInt(val, 10)).default('3'),
  RETRY_DELAY_MS: z.string().transform((val: string) => parseInt(val, 10)).default('5000'),
  
  // Security configuration
  HEALTH_USERNAME: z.string().min(1).optional(),
  HEALTH_PASSWORD: z.string().min(1).optional(),
  ALLOWED_IPS: z.string().optional(),
  ENABLE_AUTH: z.string().transform((val: string) => val === 'true').default('false'),
  ENABLE_IP_WHITELIST: z.string().transform((val: string) => val === 'true').default('false'),
});

export type Environment = z.infer<typeof EnvironmentSchema>;

// Database schema types
export interface Post {
  id: number;
  content: string;
  bot_id: string;
  category?: string;
  used: boolean;
  used_at?: Date;
  created_at: Date;
  updated_at: Date;
  generation_cost?: number;
  generation_tokens?: number;
  generation_model?: string;
}

export interface BotStats {
  bot_id: string;
  total_posts: number;
  used_posts: number;
  remaining_posts: number;
  last_post_at?: Date;
  last_replenishment_at?: Date;
  total_cost: number;
  total_tokens: number;
}

// Twitter API types
export interface TwitterPostResult {
  success: boolean;
  tweet_id?: string;
  error?: string;
  retry_count: number;
}

// OpenAI API types
export interface PostGenerationResult {
  content: string;
  category?: string;
  tokens_used: number;
  cost: number;
  model: string;
}

// Bot personality configuration
export interface BotPersonality {
  name: string;
  description: string;
  personality_prompt: string;
  content_sources: string[];
  posting_style: string;
  topics: string[];
  tone: 'formal' | 'casual' | 'humorous' | 'serious' | 'inspirational';
  max_length: number;
}

// Scheduling configuration
export interface ScheduleConfig {
  cron_expression: string;
  timezone: string;
  description: string;
}

// Error types
export class BotError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly retryable: boolean = false,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'BotError';
  }
}

export class DatabaseError extends BotError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'DATABASE_ERROR', false, context);
    this.name = 'DatabaseError';
  }
}

export class TwitterAPIError extends BotError {
  constructor(message: string, retryable: boolean = true, context?: Record<string, unknown>) {
    super(message, 'TWITTER_API_ERROR', retryable, context);
    this.name = 'TwitterAPIError';
  }
}

export class OpenAIError extends BotError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'OPENAI_ERROR', false, context);
    this.name = 'OpenAIError';
  }
}

// Logging types
export interface LogEntry {
  timestamp: Date;
  level: 'error' | 'warn' | 'info' | 'debug';
  bot_id: string;
  message: string;
  context?: Record<string, unknown>;
  error?: Error;
}

// Health check types
export interface HealthStatus {
  bot_id: string;
  status: 'healthy' | 'warning' | 'error';
  last_post_success: boolean;
  database_connected: boolean;
  twitter_api_healthy: boolean;
  openai_api_healthy: boolean;
  posts_remaining: number;
  last_check: Date;
  errors: string[];
}
