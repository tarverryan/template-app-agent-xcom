import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { logger } from '../utils/logger';

// Rate limiting configuration
export const createRateLimiter = () => {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Health endpoint specific rate limiter (more restrictive)
export const healthRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // Limit each IP to 30 requests per windowMs
  message: {
    error: 'Too many health check requests, please try again later.',
    retryAfter: '5 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Manual post rate limiter (very restrictive)
export const postRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 manual posts per hour
  message: {
    error: 'Too many manual post requests, please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Basic authentication middleware
export const basicAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please provide valid credentials'
    });
  }

  // Extract credentials from Authorization header
  const credentials = Buffer.from(authHeader.split(' ')[1], 'base64').toString();
  const [username, password] = credentials.split(':');

  // Validate against environment variables
  const expectedUsername = process.env.HEALTH_USERNAME;
  const expectedPassword = process.env.HEALTH_PASSWORD;

  if (!expectedUsername || !expectedPassword) {
    logger.error('Health authentication credentials not configured');
    return res.status(500).json({
      error: 'Server configuration error'
    });
  }

  if (username === expectedUsername && password === expectedPassword) {
    next();
  } else {
    logger.warn(`Failed authentication attempt from IP: ${req.ip}`);
    return res.status(401).json({
      error: 'Invalid credentials',
      message: 'Please provide valid username and password'
    });
  }
};

// Input validation middleware
export const validatePostRequest = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Only allow POST requests with no body or empty body
  if (req.method === 'POST' && Object.keys(req.body || {}).length > 0) {
    return res.status(400).json({
      error: 'Invalid request',
      message: 'Manual post endpoint does not accept request body'
    });
  }
  next();
};

// Security headers middleware
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  frameguard: {
    action: 'deny'
  }
});

// Request logging middleware
export const requestLogger = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent')?.substring(0, 100) || 'Unknown'
    };

    if (res.statusCode >= 400) {
      logger.warn('HTTP Request', logData);
    } else {
      logger.info('HTTP Request', logData);
    }
  });

  next();
};

// Error handling middleware
export const errorHandler = (err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  // Don't expose internal errors to client
  res.status(500).json({
    error: 'Internal server error',
    message: 'An unexpected error occurred'
  });
};

// IP whitelist middleware (optional)
export const ipWhitelist = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const allowedIPs = process.env.ALLOWED_IPS?.split(',') || [];
  const clientIP = req.ip;

  if (allowedIPs.length > 0 && clientIP && !allowedIPs.includes(clientIP)) {
    logger.warn(`Blocked request from unauthorized IP: ${clientIP}`);
    return res.status(403).json({
      error: 'Access denied',
      message: 'Your IP address is not authorized to access this endpoint'
    });
  }

  next();
};
