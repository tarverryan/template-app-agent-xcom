# Deployment Checklist - X.com Bot Template

This checklist ensures a successful deployment of the X.com Bot Template to production.

## 📋 Pre-Deployment Checklist

### Environment Setup
- [ ] **Repository cloned** and up to date
- [ ] **Node.js 18+** installed on deployment machine
- [ ] **Docker & Docker Compose** installed and configured
- [ ] **Git** configured with proper credentials
- [ ] **Environment variables** prepared (see `.env.example`)

### API Configuration
- [ ] **Twitter Developer Account** created and approved
- [ ] **Twitter API keys** generated (Read + Write permissions)
- [ ] **OpenAI API key** obtained and validated
- [ ] **API rate limits** understood and planned for
- [ ] **API keys tested** in development environment

### Security Preparation
- [ ] **Environment file** created with secure values
- [ ] **API keys rotated** from development values
- [ ] **File permissions** set correctly (600 for .env)
- [ ] **Network access** restricted appropriately
- [ ] **Security audit** completed (`npm audit`)

## 🚀 Deployment Steps

### 1. Environment Configuration

```bash
# Navigate to bot directory
cd app/app-agent-xcom-template

# Copy environment template
cp .env.example .env

# Edit with production values
nano .env
```

**Required Environment Variables:**
```bash
# Twitter API Configuration
TWITTER_API_KEY=your_production_api_key
TWITTER_API_SECRET=your_production_api_secret
TWITTER_ACCESS_TOKEN=your_production_access_token
TWITTER_ACCESS_SECRET=your_production_access_secret

# OpenAI Configuration
OPENAI_API_KEY=your_production_openai_key

# Bot Configuration
BOT_NAME=your_bot_name
POSTING_SCHEDULE=0 9 * * *  # 9 AM daily
NODE_ENV=production
LOG_LEVEL=info
```

### 2. Database Setup

```bash
# Generate initial posts
npm run seed-all

# Verify post generation
npm run seed-stats

# Check database integrity
ls -la data/
```

### 3. Quality Assurance

```bash
# Run QA checks from root directory
cd ../..
npm run qa

# Verify all checks pass
# Fix any issues before proceeding
```

### 4. Docker Build

```bash
# Build production image
cd app/app-agent-xcom-template
docker build -t template-bot .

# Test container locally
docker run --rm --env-file .env template-bot npm test
```

### 5. Production Deployment

```bash
# Using Docker Compose (recommended)
cd ../..
docker-compose up -d

# Or using Docker directly
cd app/app-agent-xcom-template
docker run -d \
  --name template-bot \
  --env-file .env \
  --restart unless-stopped \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/logs:/app/logs \
  template-bot
```

## ✅ Post-Deployment Verification

### Health Checks
- [ ] **Container running** without errors
- [ ] **Health endpoint** responding (`curl http://localhost:3000/health`)
- [ ] **Logs clean** (no error messages)
- [ ] **Database accessible** and populated
- [ ] **Scheduled posting** configured correctly

### API Integration
- [ ] **Twitter API** connection successful
- [ ] **OpenAI API** connection successful
- [ ] **Rate limits** respected
- [ ] **Authentication** working properly
- [ ] **Manual posting** functional

### Content Verification
- [ ] **Posts generated** in database
- [ ] **Content quality** meets standards
- [ ] **Character limits** respected
- [ ] **Hashtags** properly formatted
- [ ] **No profanity** or inappropriate content

## 🔧 Configuration Options

### Scheduling
```bash
# Daily at 9 AM
POSTING_SCHEDULE=0 9 * * *

# Every 6 hours
POSTING_SCHEDULE=0 */6 * * *

# Weekdays only at 10 AM
POSTING_SCHEDULE=0 10 * * 1-5
```

### Logging
```bash
# Production logging
LOG_LEVEL=info

# Debug logging (development only)
LOG_LEVEL=debug

# Error only
LOG_LEVEL=error
```

### Rate Limiting
```bash
# Twitter API rate limits
TWITTER_RATE_LIMIT=300  # tweets per 3 hours

# OpenAI API rate limits
OPENAI_RATE_LIMIT=100   # requests per minute
```

## 🚨 Troubleshooting

### Common Issues

#### Container Won't Start
```bash
# Check logs
docker logs template-bot

# Verify environment file
cat .env

# Test configuration
docker run --rm --env-file .env template-bot npm run test
```

#### API Connection Issues
```bash
# Test Twitter API
curl -X GET "https://api.twitter.com/2/users/me" \
  -H "Authorization: Bearer YOUR_BEARER_TOKEN"

# Test OpenAI API
curl -X POST "https://api.openai.com/v1/chat/completions" \
  -H "Authorization: Bearer YOUR_OPENAI_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-3.5-turbo","messages":[{"role":"user","content":"Hello"}]}'
```

#### Database Issues
```bash
# Check database file
ls -la data/

# Verify database integrity
sqlite3 data/template-bot.db "SELECT COUNT(*) FROM posts;"

# Reset database if needed
rm data/template-bot.db
npm run seed-all
```

### Emergency Procedures

#### Stop Bot
```bash
# Stop container
docker stop template-bot

# Remove container
docker rm template-bot

# Stop all services
docker-compose down
```

#### Restart Bot
```bash
# Restart container
docker restart template-bot

# Or rebuild and restart
docker-compose down
docker-compose up -d --build
```

#### Rollback
```bash
# Revert to previous version
git checkout HEAD~1

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

## 📊 Monitoring

### Health Monitoring
```bash
# Check bot status
curl http://localhost:3000/health

# Monitor logs
docker logs -f template-bot

# Check resource usage
docker stats template-bot
```

### Performance Metrics
- [ ] **Response times** under 5 seconds
- [ ] **Memory usage** under 512MB
- [ ] **CPU usage** under 50%
- [ ] **Disk usage** reasonable
- [ ] **Network activity** normal

### Content Metrics
- [ ] **Posts generated** daily
- [ ] **Posts posted** successfully
- [ ] **API errors** minimal
- [ ] **Rate limit hits** none
- [ ] **Content quality** high

## 🔄 Maintenance

### Regular Tasks
- [ ] **Daily**: Check logs for errors
- [ ] **Weekly**: Review API usage and costs
- [ ] **Monthly**: Rotate API keys
- [ ] **Quarterly**: Update dependencies
- [ ] **Annually**: Review and update configuration

### Updates
```bash
# Update code
git pull origin main

# Update dependencies
npm update

# Rebuild container
docker-compose down
docker-compose up -d --build

# Run tests
npm test
```

## 📞 Support

### Documentation
- [Architecture Documentation](./architecture/README.md)
- [API Documentation](./api/README.md)
- [Security Guide](./bot/SECURITY.md)
- [Operations Guide](./operations/README.md)

### Emergency Contacts
- **Immediate Issues**: Stop bot and check logs
- **Configuration Help**: Review this checklist
- **API Issues**: Check Twitter/OpenAI status pages
- **Security Issues**: Follow security documentation

---

**Deployment Status**: ✅ **READY FOR PRODUCTION**  
**Last Updated**: January 2025  
**Template Version**: 1.0.0
