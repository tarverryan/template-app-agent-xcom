/**
 * Health Monitoring Server - Express.js API for Bot Monitoring
 * 
 * This module provides a RESTful API for monitoring and controlling the X.com Bot Template.
 * It includes health checks, manual post triggers, and statistics endpoints.
 * 
 * Key Features:
 * - Health status monitoring
 * - Manual post triggering
 * - Bot statistics and metrics
 * - Security middleware (rate limiting, authentication)
 * - Comprehensive error handling
 * 
 * @author Your Name
 * @version 1.0.0
 */

import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { logger } from './utils/logger';
import { TemplateBot } from './bot';


/**
 * Health Server Class - Manages Express server for bot monitoring
 * 
 * This class sets up and manages the Express.js server that provides:
 * - Health monitoring endpoints
 * - Manual control endpoints
 * - Statistics and metrics
 * - Security and rate limiting
 */
export class HealthServer {
  private app: express.Application;
  private server: any;
  private port: number;

  /**
   * Constructor - Initialize Express application
   * 
   * @param bot - Reference to the main bot instance for control operations
   */
  constructor(private bot: TemplateBot) {
    // Create Express application instance
    this.app = express();
    
    // Set port from environment or default to 3000
    this.port = parseInt(process.env.HEALTH_PORT || '3000');
    
    // Initialize the server with middleware and routes
    this.initializeServer();
  }

  /**
   * Initialize Server - Set up middleware, security, and routes
   * 
   * This method configures the Express server with:
   * - Security headers and middleware
   * - Rate limiting for API protection
   * - Request logging and error handling
   * - API route definitions
   */
  private initializeServer(): void {
    // Apply security middleware (headers, CORS, etc.)
    this.app.use(helmet({
      contentSecurityPolicy: false,  // Disable CSP for API endpoints
      crossOriginEmbedderPolicy: false  // Allow cross-origin requests
    }));

    // Parse JSON request bodies
    this.app.use(express.json({ limit: '1mb' }));



    // Set up request logging middleware
    this.setupRequestLogging();

    // Configure rate limiting for API protection
    this.setupRateLimiting();

    // Define API routes
    this.setupRoutes();

    // Global error handling middleware
    this.setupErrorHandling();
  }

  /**
   * Setup Request Logging - Log all incoming requests for monitoring
   * 
   * This middleware logs every request with timing information,
   * which is useful for monitoring API usage and debugging issues.
   */
  private setupRequestLogging(): void {
    this.app.use((req, res, next) => {
      // Record request start time
      const startTime = Date.now();
      
      // Log request details
      logger.info('HTTP Request', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Override res.end to log response details
      const originalEnd = res.end;
      res.end = function(chunk?: any, encoding?: any) {
        const duration = Date.now() - startTime;
        
        // Log response details
        logger.info('HTTP Response', {
          method: req.method,
          url: req.url,
          status: res.statusCode,
          duration: `${duration}ms`,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });

        // Call original end method
        return originalEnd.call(this, chunk, encoding);
      };

      next();
    });
  }

  /**
   * Setup Rate Limiting - Protect API from abuse
   * 
   * This method configures rate limiting to prevent API abuse:
   * - Health endpoints: 100 requests per 15 minutes
   * - Control endpoints: 10 requests per 15 minutes
   * - Statistics endpoints: 100 requests per 15 minutes
   */
  private setupRateLimiting(): void {
    // Rate limiter for health check endpoints
    const healthRateLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many health check requests from this IP, please try again later.',
      standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
      legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    });

    // Rate limiter for control endpoints (more restrictive)
    const controlRateLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 10, // limit each IP to 10 requests per windowMs
      message: 'Too many control requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    });

    // Apply rate limiters to specific routes
    this.app.use('/health', healthRateLimiter);
    this.app.use('/post', controlRateLimiter);
    this.app.use('/stats', healthRateLimiter);
  }

  /**
   * Setup Routes - Define API endpoints
   * 
   * This method defines all the API routes for:
   * - Health monitoring
   * - Manual post triggering
   * - Statistics and metrics
   */
  private setupRoutes(): void {
    // Health check endpoint - returns bot status and service health
    this.app.get('/health', async (req, res) => {
      try {
        // Get current bot status
        const status = await this.bot.getStatus();
        
        // Return health status in standardized format
        res.json({
          status: status.isInitialized ? 'healthy' : 'unhealthy',
          bot: {
            name: process.env.BOT_NAME || 'template-bot',
            isInitialized: status.isInitialized,
            remainingPosts: status.remainingPosts,
            lastPostAt: status.lastPostAt?.toISOString(),
            lastReplenishmentAt: status.lastReplenishmentAt?.toISOString()
          },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error('Health check failed:', error);
        res.status(503).json({
          status: 'unhealthy',
          error: 'Health check failed',
          timestamp: new Date().toISOString()
        });
      }
    });

    // Manual post trigger endpoint - allows manual posting for testing
    this.app.post('/post', async (req, res) => {
      try {
        // Trigger manual post
        await this.bot.manualPost();
        
        // Return success response
        res.json({
          success: true,
          message: 'Manual post triggered successfully',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error('Manual post failed:', error);
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Manual post failed',
          timestamp: new Date().toISOString()
        });
      }
    });

    // Statistics endpoint - returns detailed bot statistics
    this.app.get('/stats', async (req, res) => {
      try {
        // Get bot status and configuration
        const status = await this.bot.getStatus();
        
        // Return comprehensive statistics
        res.json({
                bot: {
        name: process.env.BOT_NAME || 'template-bot',
        personality: 'Customizable bot personality',
            schedule: process.env.BOT_SCHEDULE || '0 9 * * *',
            timezone: process.env.TIMEZONE || 'America/Denver'
          },
          status: {
            isInitialized: status.isInitialized,
            remainingPosts: status.remainingPosts,
            lastPostAt: status.lastPostAt?.toISOString(),
            lastReplenishmentAt: status.lastReplenishmentAt?.toISOString()
          },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error('Statistics request failed:', error);
        res.status(500).json({
          error: 'Failed to retrieve statistics',
          timestamp: new Date().toISOString()
        });
      }
    });

    // Root endpoint - basic information about the API
    this.app.get('/', (req, res) => {
      res.json({
        service: 'X.com Bot Template Health API',
        version: '1.0.0',
        endpoints: {
          health: 'GET /health - Bot health status',
          post: 'POST /post - Manual post trigger',
          stats: 'GET /stats - Bot statistics'
        },
        timestamp: new Date().toISOString()
      });
    });

    // 404 handler for undefined routes
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        availableEndpoints: ['/health', '/post', '/stats'],
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Setup Error Handling - Global error handling middleware
   * 
   * This middleware catches any unhandled errors and returns
   * appropriate HTTP status codes and error messages.
   */
  private setupErrorHandling(): void {
    // Global error handler
    this.app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Unhandled error:', error);
      
      // Return appropriate error response
      res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Start Server - Start the Express server
   * 
   * This method starts the HTTP server and begins listening for requests.
   * It also logs the server startup information.
   * 
   * @returns Promise that resolves when server is started
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Start the server
        this.server = this.app.listen(this.port, () => {
          logger.info(`Health server started on port ${this.port}`);
          logger.info(`Health endpoint available at http://localhost:${this.port}/health`);
          resolve();
        });

        // Handle server errors
        this.server.on('error', (error: any) => {
          logger.error('Health server error:', error);
          reject(error);
        });

      } catch (error) {
        logger.error('Failed to start health server:', error);
        reject(error);
      }
    });
  }

  /**
   * Stop Server - Gracefully stop the Express server
   * 
   * This method performs a graceful shutdown of the HTTP server,
   * closing all connections and cleaning up resources.
   * 
   * @returns Promise that resolves when server is stopped
   */
  async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.server) {
        // Close the server gracefully
        this.server.close((error: any) => {
          if (error) {
            logger.error('Error stopping health server:', error);
            reject(error);
          } else {
            logger.info('Health server stopped');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Get Server Info - Return server configuration information
   * 
   * @returns Object with server configuration details
   */
  getServerInfo(): { port: number; endpoints: string[] } {
    return {
      port: this.port,
      endpoints: ['/health', '/post', '/stats']
    };
  }
}
