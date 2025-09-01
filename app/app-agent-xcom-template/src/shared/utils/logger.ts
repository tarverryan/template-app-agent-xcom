import winston from 'winston';
import { EnvironmentSchema } from '../types';

// Load environment variables if not already loaded
if (!process.env.TWITTER_API_KEY) {
  require('dotenv').config();
}

const env = EnvironmentSchema.parse(process.env);

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, bot_id, ...meta }) => {
    const botInfo = bot_id ? `[${bot_id}] ` : '';
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} ${level}: ${botInfo}${message}${metaStr}`;
  })
);

// Custom format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

// Create logger instance
export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  defaultMeta: { 
    bot_id: env.BOT_NAME,
    service: 'shared'
  },
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    // Console transport
    new winston.transports.Console({
      format: consoleFormat,
      level: env.LOG_LEVEL
    }),
    
    // File transport for errors
    new winston.transports.File({
      filename: './logs/error.log',
      level: 'error',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // File transport for all logs
    new winston.transports.File({
      filename: './logs/combined.log',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Export logger methods for convenience
export const logInfo = (message: string, meta?: Record<string, unknown>) => {
  logger.info(message, meta);
};

export const logError = (message: string, error?: Error, meta?: Record<string, unknown>) => {
  logger.error(message, { error: error?.message, stack: error?.stack, ...meta });
};

export const logWarn = (message: string, meta?: Record<string, unknown>) => {
  logger.warn(message, meta);
};

export const logDebug = (message: string, meta?: Record<string, unknown>) => {
  logger.debug(message, meta);
};
