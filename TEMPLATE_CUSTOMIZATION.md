# Template Customization Guide

This guide provides comprehensive instructions for customizing the X.com Bot Template to create your own unique bot.

## 🎨 Visual Customization

### 1. Repository Branding

#### Social Preview Image
- **Location**: `.github/social-preview.png`
- **Size**: 1280x640 pixels
- **Content**: Your bot's logo, name, and tagline
- **Tools**: Canva, Figma, or any image editor

#### Repository Description
Update the repository description in GitHub settings:
```
AI-powered X.com bot template with customizable personality, automated posting, and enterprise-grade security
```

#### Topics and Tags
Add relevant topics to your repository:
- `x-com-bot`
- `twitter-bot`
- `ai-powered`
- `automated-posting`
- `social-media`
- `openai`
- `typescript`
- `docker`
- `template`

### 2. Documentation Customization

#### README.md
- Update project title and description
- Replace template references with your bot's name
- Add your own screenshots and examples
- Update installation instructions

#### Branding Elements
- Replace "Template Bot" with your bot's name
- Update all placeholder text
- Add your own logo and branding
- Customize color schemes and styling

## 🤖 Bot Personality Customization

### 1. Personality Configuration

Edit `app/app-agent-xcom-template/src/config/personality.ts`:

```typescript
export const personalityConfig: PersonalityConfig = {
  name: "Your Bot Name",
  description: "Your bot's description",
  voice: "Your bot's voice and personality",
  topics: [
    // Your topics here
  ],
  writingStyle: "Your writing style",
  tone: "Your tone",
  hashtags: [
    // Your hashtags here
  ],
  emojis: [
    // Your emojis here
  ]
};
```

### 2. Content Generation

#### Topics Selection
Choose topics that align with your bot's purpose:
- **Tech Bot**: AI, programming, startups
- **Business Bot**: entrepreneurship, finance, leadership
- **Lifestyle Bot**: wellness, productivity, personal growth
- **Creative Bot**: art, design, creativity

#### Writing Style
Define your bot's writing characteristics:
- **Formal**: Professional and business-like
- **Casual**: Friendly and conversational
- **Technical**: Detailed and analytical
- **Creative**: Imaginative and artistic

#### Tone Examples
- **Encouraging**: Supportive and motivating
- **Humorous**: Witty and entertaining
- **Educational**: Informative and helpful
- **Inspirational**: Uplifting and motivational

### 3. Posting Schedule

Configure your posting frequency in `docker-compose.yml`:

```yaml
environment:
  - POSTING_SCHEDULE=0 9 * * *  # Daily at 9 AM
  # Other schedules:
  # 0 9 * * 1-5  # Weekdays at 9 AM
  # 0 12 * * *   # Daily at 12 PM
  # 0 18 * * *   # Daily at 6 PM
```

## 🔧 Technical Customization

### 1. Environment Configuration

#### Required Variables
```bash
# Twitter API
TWITTER_API_KEY=your_api_key
TWITTER_API_SECRET=your_api_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_SECRET=your_access_secret

# OpenAI API
OPENAI_API_KEY=your_openai_key

# Bot Configuration
BOT_NAME=your_bot_name
POSTING_SCHEDULE=0 9 * * *
```

#### Optional Variables
```bash
# Customization
BOT_DESCRIPTION=your_bot_description
CONTENT_THEME=your_theme
POSTING_TIMEZONE=UTC

# Advanced
LOG_LEVEL=info
DATABASE_PATH=./data/your-bot.db
HEALTH_CHECK_PORT=3000
```

### 2. Docker Customization

#### Container Configuration
```yaml
services:
  your-bot-name:
    build:
      context: ./app/app-agent-xcom-template
      dockerfile: Dockerfile
    container_name: your-bot-name
    environment:
      - BOT_NAME=your_bot_name
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
```

#### Health Monitoring
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### 3. API Customization

#### Health Endpoints
Customize health check responses in `src/health.ts`:

```typescript
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    bot: {
      name: process.env.BOT_NAME || 'your-bot-name',
      version: '1.0.0',
      uptime: process.uptime(),
      personality: 'your-personality'
    }
  });
});
```

#### Custom Endpoints
Add your own API endpoints:

```typescript
app.get('/custom', (req, res) => {
  res.json({
    message: 'Your custom endpoint',
    data: 'Your custom data'
  });
});
```

## 📊 Analytics and Monitoring

### 1. Performance Monitoring

#### Custom Metrics
Add your own performance metrics:

```typescript
// Track custom metrics
const customMetrics = {
  postsGenerated: 0,
  postsPosted: 0,
  errors: 0,
  responseTime: 0
};
```

#### Health Checks
Customize health check criteria:

```typescript
const healthCheck = {
  database: checkDatabaseConnection(),
  twitter: checkTwitterAPI(),
  openai: checkOpenAIAPI(),
  posts: checkPostAvailability()
};
```

### 2. Logging Customization

#### Log Levels
Configure logging in `src/utils/logger.ts`:

```typescript
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: {
    bot_id: process.env.BOT_NAME,
    service: 'your-bot-service'
  }
});
```

#### Custom Log Messages
Add your own log messages:

```typescript
logger.info('Your bot started successfully', {
  botName: process.env.BOT_NAME,
  personality: personalityConfig.name,
  topics: personalityConfig.topics.length
});
```

## 🎯 Advanced Features

### 1. Plugin System

Create a plugin architecture:

```typescript
// plugins/analytics.ts
export interface Plugin {
  name: string;
  initialize(): Promise<void>;
  execute(data: any): Promise<any>;
}

export class AnalyticsPlugin implements Plugin {
  name = 'analytics';
  
  async initialize() {
    // Initialize analytics
  }
  
  async execute(data: any) {
    // Track analytics
  }
}
```

### 2. Multi-language Support

Add internationalization:

```typescript
// i18n/index.ts
import i18n from 'i18next';

i18n.init({
  lng: process.env.LANGUAGE || 'en',
  resources: {
    en: { translation: require('./locales/en.json') },
    es: { translation: require('./locales/es.json') },
    fr: { translation: require('./locales/fr.json') }
  }
});
```

### 3. Advanced Content Generation

#### Custom Generators
Create custom content generators:

```typescript
// generators/custom-generator.ts
export class CustomGenerator {
  static async generateCustomContent(topic: string): Promise<string> {
    // Your custom generation logic
    return 'Custom generated content';
  }
}
```

#### Content Filters
Add content filtering:

```typescript
// filters/content-filter.ts
export class ContentFilter {
  static filterContent(content: string): string {
    // Your filtering logic
    return filteredContent;
  }
}
```

## 🚀 Deployment Customization

### 1. Cloud Deployment

#### AWS Deployment
```yaml
# .github/workflows/deploy-aws.yml
name: Deploy to AWS
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to ECS
        run: |
          # Your AWS deployment commands
```

#### Google Cloud Deployment
```yaml
# .github/workflows/deploy-gcp.yml
name: Deploy to GCP
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Cloud Run
        run: |
          # Your GCP deployment commands
```

### 2. Environment-Specific Configuration

#### Development
```bash
# .env.development
NODE_ENV=development
LOG_LEVEL=debug
POSTING_SCHEDULE=0 */2 * * *  # Every 2 hours
```

#### Production
```bash
# .env.production
NODE_ENV=production
LOG_LEVEL=info
POSTING_SCHEDULE=0 9 * * *  # Daily at 9 AM
```

## 📈 Performance Optimization

### 1. Database Optimization

#### Indexing
```sql
-- Add indexes for better performance
CREATE INDEX idx_posts_used ON posts(used);
CREATE INDEX idx_posts_category ON posts(category);
CREATE INDEX idx_posts_created_at ON posts(created_at);
```

#### Connection Pooling
```typescript
// database/connection.ts
import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./data/bot.db', (err) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Connected to database');
  }
});
```

### 2. Caching

#### Memory Caching
```typescript
// cache/memory-cache.ts
class MemoryCache {
  private cache = new Map();
  
  set(key: string, value: any, ttl: number = 3600) {
    this.cache.set(key, {
      value,
      expires: Date.now() + ttl * 1000
    });
  }
  
  get(key: string) {
    const item = this.cache.get(key);
    if (item && item.expires > Date.now()) {
      return item.value;
    }
    this.cache.delete(key);
    return null;
  }
}
```

## 🔒 Security Customization

### 1. Authentication

#### API Authentication
```typescript
// middleware/auth.ts
import jwt from 'jsonwebtoken';

export const authenticateToken = (req: any, res: any, next: any) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.sendStatus(401);
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};
```

### 2. Rate Limiting

#### Custom Rate Limits
```typescript
// middleware/rate-limit.ts
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});
```

## 📚 Best Practices

### 1. Code Organization
- Keep related files together
- Use consistent naming conventions
- Document complex functions
- Follow TypeScript best practices

### 2. Testing
- Write unit tests for core functionality
- Test error conditions
- Mock external dependencies
- Maintain high test coverage

### 3. Documentation
- Keep documentation up to date
- Include code examples
- Document configuration options
- Provide troubleshooting guides

### 4. Security
- Never commit secrets
- Use environment variables
- Validate all inputs
- Implement proper error handling

## 🎉 Getting Started

1. **Fork the template** to your GitHub account
2. **Customize the personality** in `src/config/personality.ts`
3. **Update branding** in README and documentation
4. **Configure environment** variables
5. **Test locally** with Docker
6. **Deploy** to your preferred platform
7. **Monitor** and iterate

---

**Ready to create something amazing?** 🚀

This template provides a solid foundation for building professional, AI-powered X.com bots. Customize it to match your vision and create something truly unique!
