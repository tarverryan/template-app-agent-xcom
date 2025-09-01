/**
 * Template Twitter Service - Twitter API Integration
 *
 * This class handles all interactions with the Twitter API v2 for the X.com Bot Template.
 * It provides functionality for posting tweets, retrieving tweet information, and managing
 * Twitter API authentication and rate limiting.
 * 
 * Key Features:
 * - OAuth 1.0a authentication with Twitter API v2
 * - Tweet posting with content validation
 * - Rate limit handling and error recovery
 * - Comprehensive error handling and logging
 * - Connection testing and health monitoring
 * 
 * Dependencies:
 * - twitter-api-v2: Official Twitter API v2 client
 * - Environment variables for API credentials
 * 
 * @author Your Name
 * @version 1.0.0
 */

import { TwitterApi } from 'twitter-api-v2';
import { logger } from '../utils/logger';
import { TwitterAPIError } from '../shared/types';

/**
 * Template Twitter Service Class
 *
 * Manages all Twitter API interactions for the X.com Bot Template.
 * Handles authentication, posting, retrieval, and error management for
 * Twitter operations with proper rate limiting and error recovery.
 */
export class TemplateTwitterService {
  private client: TwitterApi | null = null;
  private isInitialized = false;

  /**
   * Initialize Twitter Service - Set up API client and test connection
   * 
   * This method initializes the Twitter API client using OAuth 1.0a credentials
   * from environment variables. It tests the connection to ensure the credentials
   * are valid and the service is ready for use.
   * 
   * Required Environment Variables:
   * - TWITTER_API_KEY: Twitter API key
   * - TWITTER_API_SECRET: Twitter API secret
   * - TWITTER_ACCESS_TOKEN: Twitter access token
   * - TWITTER_ACCESS_SECRET: Twitter access token secret
   * 
   * @throws TwitterAPIError if initialization fails or credentials are missing
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing Twitter service...');

      // Retrieve Twitter API credentials from environment variables
      const apiKey = process.env.TWITTER_API_KEY;
      const apiSecret = process.env.TWITTER_API_SECRET;
      const accessToken = process.env.TWITTER_ACCESS_TOKEN;
      const accessSecret = process.env.TWITTER_ACCESS_SECRET;

      // Validate that all required credentials are present
      if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
        throw new TwitterAPIError('Missing Twitter API credentials', false);
      }

      // Create Twitter client with OAuth 1.0a authentication
      this.client = new TwitterApi({
        appKey: apiKey,
        appSecret: apiSecret,
        accessToken: accessToken,
        accessSecret: accessSecret,
      });

      // Test the connection by retrieving user information
      const me = await this.client.v2.me();
      logger.info(`Twitter service initialized for user: @${me.data.username}`);

      this.isInitialized = true;
    } catch (error) {
      logger.error('Failed to initialize Twitter service:', error);
      throw new TwitterAPIError(
        `Twitter initialization failed: ${error instanceof Error ? error.message : String(error)}`,
        false
      );
    }
  }

  /**
   * Post Tweet - Post content to Twitter with validation and error handling
   * 
   * This method posts a tweet to Twitter with comprehensive validation and error handling.
   * It checks content length, handles rate limits, and provides detailed error messages
   * for different failure scenarios.
   * 
   * @param content - The tweet content to post (max 280 characters)
   * @returns Promise<string> - The tweet ID of the posted tweet
   * @throws TwitterAPIError if posting fails or content is invalid
   */
  async postTweet(content: string): Promise<string> {
    if (!this.isInitialized || !this.client) {
      throw new TwitterAPIError('Twitter service not initialized', false);
    }

    try {
      logger.info('Posting tweet to Twitter...');

      // Validate content length (Twitter's character limit)
      if (content.length > 280) {
        throw new TwitterAPIError('Tweet content exceeds 280 character limit', false);
      }

      // Validate content is not empty
      if (!content.trim()) {
        throw new TwitterAPIError('Tweet content cannot be empty', false);
      }

      // Post the tweet using Twitter API v2
      const tweet = await this.client.v2.tweet(content);
      
      // Validate that we received a valid tweet ID in response
      if (!tweet.data?.id) {
        throw new TwitterAPIError('Failed to get tweet ID from response', true);
      }

      logger.info(`Successfully posted tweet: ${tweet.data.id}`);
      return tweet.data.id;

    } catch (error) {
      logger.error('Failed to post tweet:', error);
      
      // Handle specific Twitter API errors with appropriate error types
      if (error instanceof Error) {
        if (error.message.includes('rate limit')) {
          throw new TwitterAPIError('Rate limit exceeded', true);
        } else if (error.message.includes('duplicate')) {
          throw new TwitterAPIError('Duplicate tweet content', false);
        } else if (error.message.includes('forbidden')) {
          throw new TwitterAPIError('Tweet content violates Twitter rules', false);
        } else if (error.message.includes('unauthorized')) {
          throw new TwitterAPIError('Twitter API credentials are invalid', false);
        }
      }

      // Generic error handling for unknown failures
      throw new TwitterAPIError(
        `Failed to post tweet: ${error instanceof Error ? error.message : String(error)}`,
        true
      );
    }
  }

  /**
   * Get Tweet - Retrieve tweet information by ID
   * 
   * This method retrieves detailed information about a specific tweet including
   * creation time, metrics, and content. Useful for monitoring and verification.
   * 
   * @param tweetId - The ID of the tweet to retrieve
   * @returns Promise<any> - Tweet data object with details
   * @throws TwitterAPIError if retrieval fails
   */
  async getTweet(tweetId: string): Promise<any> {
    if (!this.isInitialized || !this.client) {
      throw new TwitterAPIError('Twitter service not initialized', false);
    }

    try {
      // Retrieve tweet with specific fields for comprehensive information
      const tweet = await this.client.v2.singleTweet(tweetId, {
        'tweet.fields': ['created_at', 'public_metrics', 'text']
      });

      return tweet.data;
    } catch (error) {
      logger.error('Failed to get tweet:', error);
      throw new TwitterAPIError(
        `Failed to get tweet: ${error instanceof Error ? error.message : String(error)}`,
        true
      );
    }
  }

  /**
   * Delete Tweet - Remove a tweet from Twitter
   * 
   * This method deletes a tweet from Twitter using its ID. Useful for content
   * moderation or error correction.
   * 
   * @param tweetId - The ID of the tweet to delete
   * @returns Promise<boolean> - True if deletion was successful
   * @throws TwitterAPIError if deletion fails
   */
  async deleteTweet(tweetId: string): Promise<boolean> {
    if (!this.isInitialized || !this.client) {
      throw new TwitterAPIError('Twitter service not initialized', false);
    }

    try {
      logger.info(`Deleting tweet: ${tweetId}`);

      // Delete the tweet using Twitter API v2
      await this.client.v2.deleteTweet(tweetId);
      
      logger.info(`Successfully deleted tweet: ${tweetId}`);
      return true;
    } catch (error) {
      logger.error('Failed to delete tweet:', error);
      throw new TwitterAPIError(
        `Failed to delete tweet: ${error instanceof Error ? error.message : String(error)}`,
        true
      );
    }
  }

  /**
   * Test Connection - Verify Twitter API connectivity and credentials
   * 
   * This method tests the Twitter API connection by attempting to retrieve
   * the authenticated user's information. Used for health checks and
   * credential validation.
   * 
   * @returns Promise<boolean> - True if connection is successful
   * @throws TwitterAPIError if connection test fails
   */
  async testConnection(): Promise<boolean> {
    if (!this.isInitialized || !this.client) {
      throw new TwitterAPIError('Twitter service not initialized', false);
    }

    try {
      // Test connection by retrieving user information
      const me = await this.client.v2.me();
      
      if (me.data?.username) {
        logger.info(`Twitter connection test successful for user: @${me.data.username}`);
        return true;
      } else {
        throw new TwitterAPIError('Failed to retrieve user information', false);
      }
    } catch (error) {
      logger.error('Twitter connection test failed:', error);
      throw new TwitterAPIError(
        `Connection test failed: ${error instanceof Error ? error.message : String(error)}`,
        false
      );
    }
  }

  /**
   * Get Rate Limit Status - Check current rate limit status
   * 
   * This method retrieves the current rate limit status for Twitter API endpoints.
   * Useful for monitoring and preventing rate limit violations.
   * 
   * @returns Promise<any> - Rate limit information
   * @throws TwitterAPIError if rate limit check fails
   */
  async getRateLimitStatus(): Promise<any> {
    if (!this.isInitialized || !this.client) {
      throw new TwitterAPIError('Twitter service not initialized', false);
    }

    try {
      // Get rate limit status for tweets endpoint
      // TODO: Fix rate limit status method
      logger.warn('Rate limit status method not implemented');
      return { limit: 0, remaining: 0, reset: 0 };
    } catch (error) {
      logger.error('Failed to get rate limit status:', error);
      throw new TwitterAPIError(
        `Failed to get rate limit status: ${error instanceof Error ? error.message : String(error)}`,
        true
      );
    }
  }

  /**
   * Check if Service is Initialized
   * 
   * @returns boolean - True if the service is properly initialized
   */
  isServiceInitialized(): boolean {
    return this.isInitialized && this.client !== null;
  }
}
