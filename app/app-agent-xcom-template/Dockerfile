# X.com Bot Template Dockerfile
# Multi-stage build for optimized production image

# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init curl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S botuser -u 1001

# Set working directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder --chown=botuser:nodejs /app/dist ./dist
COPY --from=builder --chown=botuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=botuser:nodejs /app/package*.json ./

# Create data and logs directories
RUN mkdir -p data logs && \
    chown -R botuser:nodejs data logs

# Switch to non-root user
USER botuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/index.js"]
