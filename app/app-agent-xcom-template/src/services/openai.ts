/**
 * Template OpenAI Service - OpenAI API Integration for Content Generation
 *
 * This class handles all interactions with the OpenAI API for content generation
 * for the X.com Bot Template. It provides functionality for generating posts
 * using GPT models with proper rate limiting, error handling, and content validation.
 * 
 * Key Features:
 * - OpenAI GPT-4 integration for content generation
 * - Batch processing with rate limit management
 * - Content moderation and validation
 * - Cost tracking and token usage monitoring
 * - Comprehensive error handling and retry logic
 * 
 * Dependencies:
 * - openai: Official OpenAI Node.js client
 * - Environment variables for API configuration
 * - Personality configuration for content generation
 * 
 * @author Your Name
 * @version 1.0.0
 */

import OpenAI from 'openai';
import { logger } from '../utils/logger';
import { OpenAIError, PostGenerationResult } from '../shared/types';
import { personalityConfig } from '../config/personality';

/**
 * Template OpenAI Service Class
 * 
 * Manages all OpenAI API interactions for content generation. Handles authentication,
 * content generation, rate limiting, and error management for OpenAI operations.
 */
export class TemplateOpenAIService {
  private client: OpenAI | null = null;
  private isInitialized = false;

  /**
   * Initialize OpenAI Service - Set up API client and test connection
   * 
   * This method initializes the OpenAI API client using the API key from environment
   * variables. It tests the connection to ensure the credentials are valid and the
   * service is ready for content generation.
   * 
   * Required Environment Variables:
   * - OPENAI_API_KEY: OpenAI API key for authentication
   * - OPENAI_MODEL: Model to use for generation (default: gpt-4)
   * 
   * @throws OpenAIError if initialization fails or credentials are missing
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing OpenAI service...');

      // Retrieve OpenAI API credentials and configuration
      const apiKey = process.env.OPENAI_API_KEY;
      const model = process.env.OPENAI_MODEL || 'gpt-4';

      // Validate that API key is present
      if (!apiKey) {
        throw new OpenAIError('Missing OpenAI API key');
      }

      // Create OpenAI client with API key
      this.client = new OpenAI({
        apiKey: apiKey,
      });

      // Test the connection with a simple request
      await this.testConnection();
      
      logger.info(`OpenAI service initialized with model: ${model}`);
      this.isInitialized = true;
    } catch (error) {
      logger.error('Failed to initialize OpenAI service:', error);
      throw new OpenAIError(
        `OpenAI initialization failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Test Connection - Verify OpenAI API connectivity and credentials
   * 
   * This method tests the OpenAI API connection by sending a simple test request.
   * Used for health checks and credential validation during initialization.
   * 
   * @throws OpenAIError if connection test fails
   */
  private async testConnection(): Promise<void> {
    if (!this.client) {
      throw new OpenAIError('OpenAI client not initialized');
    }

    try {
      // Send a simple test request to verify API connectivity
      const response = await this.client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          {
            role: 'user',
            content: 'Hello, this is a test message. Please respond with "OK" if you can see this.'
          }
        ],
        max_tokens: 10,
        temperature: 0.1
      });

      // Validate that we received a proper response
      if (!response.choices[0]?.message?.content) {
        throw new OpenAIError('No response from OpenAI API');
      }

      logger.info('OpenAI connection test successful');
    } catch (error) {
      throw new OpenAIError(`OpenAI connection test failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generate Posts - Generate multiple posts using OpenAI API
   * 
   * This method generates a batch of posts using the OpenAI API with proper
   * rate limiting and error handling. It processes posts in smaller batches
   * to avoid rate limits and provides comprehensive error recovery.
   * 
   * @param batchSize - Number of posts to generate
   * @param categories - Array of categories to generate posts for
   * @returns Promise<PostGenerationResult[]> - Array of generated posts with metadata
   * @throws OpenAIError if generation fails or service is not initialized
   */
  async generatePosts(batchSize: number, categories: string[]): Promise<PostGenerationResult[]> {
    if (!this.isInitialized || !this.client) {
      throw new OpenAIError('OpenAI service not initialized');
    }

    try {
      logger.info(`Generating ${batchSize} posts using OpenAI...`);

      const posts: PostGenerationResult[] = [];
      const model = process.env.OPENAI_MODEL || 'gpt-4';

      // Generate posts in smaller batches to avoid rate limits
      const batchSizeLimit = 10;
      const totalBatches = Math.ceil(batchSize / batchSizeLimit);

      for (let batch = 0; batch < totalBatches; batch++) {
        const currentBatchSize = Math.min(batchSizeLimit, batchSize - batch * batchSizeLimit);
        
        logger.info(`Generating batch ${batch + 1}/${totalBatches} with ${currentBatchSize} posts...`);

        const batchPosts = await this.generateBatch(currentBatchSize, categories, model);
        posts.push(...batchPosts);

        // Add delay between batches to respect rate limits
        if (batch < totalBatches - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      logger.info(`Successfully generated ${posts.length} posts`);
      return posts;

    } catch (error) {
      logger.error('Failed to generate posts:', error);
      throw new OpenAIError(
        `Failed to generate posts: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Generate Batch - Generate a single batch of posts
   * 
   * This method generates a single batch of posts using the OpenAI API.
   * It handles the actual API calls, content validation, and response processing.
   * 
   * @param batchSize - Number of posts to generate in this batch
   * @param categories - Array of categories to generate posts for
   * @param model - OpenAI model to use for generation
   * @returns Promise<PostGenerationResult[]> - Array of generated posts
   * @throws OpenAIError if batch generation fails
   */
  private async generateBatch(batchSize: number, categories: string[], model: string): Promise<PostGenerationResult[]> {
    if (!this.client) {
      throw new OpenAIError('OpenAI client not initialized');
    }

    try {
      const posts: PostGenerationResult[] = [];

      // Generate posts for each category in the batch
      for (let i = 0; i < batchSize; i++) {
        const category = categories[i % categories.length];
        
        // Create prompt for the specific category
        const prompt = this.createPromptForCategory(category);
        
        // Generate content using OpenAI API
        const response = await this.client.chat.completions.create({
          model: model,
          messages: [
            {
              role: 'system',
              content: personalityConfig.voice
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 280, // Twitter character limit
          temperature: 0.8, // Creative but controlled randomness
          top_p: 0.9,
          frequency_penalty: 0.1,
          presence_penalty: 0.1
        });

        const content = response.choices[0]?.message?.content?.trim();
        
        if (!content) {
          logger.warn('Empty response from OpenAI, skipping post');
          continue;
        }

        // Validate and clean the generated content
        const validatedContent = this.validateAndCleanContent(content);
        
        if (validatedContent) {
          posts.push({
            content: validatedContent,
            category: category,
            cost: this.calculateCost(response.usage?.total_tokens || 0, model),
            tokens_used: response.usage?.total_tokens || 0,
            model: model
          });
        }
      }

      return posts;

    } catch (error) {
      logger.error('Failed to generate batch:', error);
      throw new OpenAIError(
        `Batch generation failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Create Prompt for Category - Generate appropriate prompt for content category
   * 
   * This method creates a specific prompt for generating content in a given category.
   * It ensures the generated content aligns with the bot's personality and the
   * specific topic area.
   * 
   * @param category - The category to generate content for
   * @returns string - Formatted prompt for the category
   */
  private createPromptForCategory(category: string): string {
    const categoryPrompts: Record<string, string> = {
      'battle_wisdom': 'Generate a tweet about battle wisdom and combat philosophy.',
      'life_advice': 'Generate a tweet with life advice and survival tips.',
      'northern_culture': 'Generate a tweet about culture and traditions.',
      'friendship': 'Generate a tweet about friendship and loyalty.',
      'redemption': 'Generate a tweet about redemption and personal growth.',
      'humor': 'Generate a witty and humorous tweet.',
      'philosophy': 'Generate a philosophical tweet about life and existence.',
      'war': 'Generate a tweet about war and its consequences.',
      'peace': 'Generate a tweet about peace and its value.',
      'death': 'Generate a tweet about death and mortality.',
      'honor': 'Generate a tweet about honor and integrity.',
      'betrayal': 'Generate a tweet about betrayal and trust.',
      'hope': 'Generate a tweet about hope and perseverance.',
      'despair': 'Generate a tweet about despair and overcoming it.',
      'power': 'Generate a tweet about power and its corrupting influence.',
      'weakness': 'Generate a tweet about weakness and vulnerability.',
      'strength': 'Generate a tweet about strength and resilience.',
      'fear': 'Generate a tweet about fear and courage.',
      'love': 'Generate a tweet about love and relationships.',
      'hate': 'Generate a tweet about hate and its destructive nature.',
      'justice': 'Generate a tweet about justice and fairness.',
      'injustice': 'Generate a tweet about injustice and oppression.',
      'freedom': 'Generate a tweet about freedom and its value.',
      'slavery': 'Generate a tweet about slavery and oppression.',
      'wealth': 'Generate a tweet about wealth and poverty.',
      'poverty': 'Generate a tweet about poverty and hardship.',
      'knowledge': 'Generate a tweet about knowledge and wisdom.',
      'ignorance': 'Generate a tweet about ignorance and its dangers.',
      'truth': 'Generate a tweet about truth and lies.',
      'lies': 'Generate a tweet about lies and deception.',
      'faith': 'Generate a tweet about faith and belief.',
      'doubt': 'Generate a tweet about doubt and uncertainty.'
    };

    return categoryPrompts[category] || `Generate a tweet about ${category}.`;
  }

  /**
   * Validate and Clean Content - Validate and clean generated content
   * 
   * This method validates the generated content to ensure it meets quality standards
   * and cleans it for use. It removes inappropriate content, validates length,
   * and ensures proper formatting.
   * 
   * @param content - Raw generated content to validate and clean
   * @returns string | null - Cleaned content or null if validation fails
   */
  private validateAndCleanContent(content: string): string | null {
    // Remove any system messages or prefixes
    let cleanedContent = content.replace(/^(System:|Assistant:|User:)/, '').trim();
    
    // Remove quotes if the entire content is quoted
    if (cleanedContent.startsWith('"') && cleanedContent.endsWith('"')) {
      cleanedContent = cleanedContent.slice(1, -1);
    }
    
    // Validate length (Twitter limit)
    if (cleanedContent.length > 280) {
      logger.warn(`Generated content too long (${cleanedContent.length} chars), truncating`);
      cleanedContent = cleanedContent.substring(0, 277) + '...';
    }
    
    // Validate minimum length
    if (cleanedContent.length < 10) {
      logger.warn('Generated content too short, skipping');
      return null;
    }
    
    // Basic content filtering
    const inappropriateWords = ['fuck', 'shit', 'ass', 'bitch', 'damn', 'hell', 'crap', 'piss'];
    const lowerContent = cleanedContent.toLowerCase();
    
    for (const word of inappropriateWords) {
      if (lowerContent.includes(word)) {
        logger.warn(`Generated content contains inappropriate word: ${word}, skipping`);
        return null;
      }
    }
    
    return cleanedContent;
  }

  /**
   * Calculate Cost - Calculate the cost of API usage
   * 
   * This method calculates the cost of OpenAI API usage based on the number
   * of tokens used and the model. Used for cost tracking and budgeting.
   * 
   * @param tokens - Number of tokens used
   * @param model - OpenAI model used
   * @returns number - Cost in USD
   */
  private calculateCost(tokens: number, model: string): number {
    const costPer1kTokens: Record<string, number> = {
      'gpt-4': 0.03,
      'gpt-4-turbo': 0.01,
      'gpt-3.5-turbo': 0.002
    };
    
    const costPerToken = (costPer1kTokens[model] || 0.03) / 1000;
    return tokens * costPerToken;
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
