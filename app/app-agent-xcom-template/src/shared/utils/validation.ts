import { z } from 'zod';

// Validation schemas
export const PostSchema = z.object({
  content: z.string().min(1).max(280),
  bot_id: z.string().min(1),
  category: z.string().optional(),
  used: z.boolean().default(false),
  used_at: z.date().optional(),
  created_at: z.date().default(() => new Date()),
  updated_at: z.date().default(() => new Date()),
  generation_cost: z.number().optional(),
  generation_tokens: z.number().optional(),
  generation_model: z.string().optional(),
  content_hash: z.string().optional()
});

export const BotStatsSchema = z.object({
  bot_id: z.string().min(1),
  total_posts: z.number().default(0),
  used_posts: z.number().default(0),
  remaining_posts: z.number().default(0),
  last_post_at: z.date().optional(),
  last_replenishment_at: z.date().optional(),
  total_cost: z.number().default(0),
  total_tokens: z.number().default(0)
});

export const TwitterPostResultSchema = z.object({
  success: z.boolean(),
  tweet_id: z.string().optional(),
  error: z.string().optional(),
  retry_count: z.number().default(0)
});

export const PostGenerationResultSchema = z.object({
  content: z.string().min(1).max(280),
  tokens_used: z.number(),
  cost: z.number(),
  model: z.string()
});

// Validation functions
export function validatePost(post: unknown) {
  return PostSchema.parse(post);
}

export function validateBotStats(stats: unknown) {
  return BotStatsSchema.parse(stats);
}

export function validateTwitterPostResult(result: unknown) {
  return TwitterPostResultSchema.parse(result);
}

export function validatePostGenerationResult(result: unknown) {
  return PostGenerationResultSchema.parse(result);
}

// Content validation
export function validateTweetContent(content: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!content || content.trim().length === 0) {
    errors.push('Content cannot be empty');
  }

  if (content.length > 280) {
    errors.push('Content exceeds 280 character limit');
  }

  // Check for potentially problematic content
  const problematicPatterns = [
    /\b(hate|kill|murder|suicide|bomb|terrorist)\b/i,
    /@\w+/g, // Mentions
    /https?:\/\/\S+/g // URLs
  ];

  // NO hashtags allowed for non-scripture bots
  const hashtagCount = (content.match(/#\w+/g) || []).length;
  if (hashtagCount > 0) {
    errors.push('Hashtags are not allowed');
  }

  // NO quotation marks allowed for non-scripture bots
  const quoteCount = (content.match(/["""]/g) || []).length;
  if (quoteCount > 0) {
    errors.push('Quotation marks are not allowed');
  }

  // NO brackets allowed for non-scripture bots
  const bracketCount = (content.match(/[\[\](){}]/g) || []).length;
  if (bracketCount > 0) {
    errors.push('Brackets and parentheses are not allowed');
  }

  // NO emojis allowed for any bot
  const emojiCount = (content.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu) || []).length;
  if (emojiCount > 0) {
    errors.push('Emojis are not allowed');
  }

  const urlCount = (content.match(/https?:\/\/\S+/g) || []).length;
  if (urlCount > 2) {
    errors.push('Too many URLs (max 2)');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Rate limiting validation
export function validateRateLimit(lastPostTime: Date, minIntervalMs: number = 60000): boolean {
  const now = new Date();
  const timeSinceLastPost = now.getTime() - lastPostTime.getTime();
  return timeSinceLastPost >= minIntervalMs;
}

// Cost validation
export function validateCost(cost: number, maxCost: number = 0.50): boolean {
  return cost <= maxCost;
}

// Token validation
export function validateTokens(tokens: number, maxTokens: number = 1000): boolean {
  return tokens <= maxTokens;
}
