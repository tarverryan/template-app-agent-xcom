# X.com Bot Template - Documentation

This directory contains all documentation specific to the X.com Bot Template.

## 📚 Documentation Structure

### Core Documentation
- **[SECURITY.md](./SECURITY.md)** - Security configuration and best practices
- **[README.md](./README.md)** - Bot setup and configuration guide

### Content Documentation
- **[sample-posts.md](./content/template-sample-posts.md)** - Sample posts generated for template
- **[post-generation-system.md](./content/template-post-generation-system.md)** - Technical details of the post generation system

## 🎯 Template Overview

**X.com Bot Template** is a fully operational X.com bot template that provides a customizable foundation for creating AI-powered social media bots.

### Key Features

- **🤖 Customizable Personality**: Easy-to-configure bot personality system
- **📝 AI-Powered Content**: OpenAI integration for content generation
- **⏰ Automated Posting**: Scheduled daily posting system
- **🔒 Security First**: Enterprise-grade security features
- **🐳 Docker Ready**: Containerized deployment
- **📊 Health Monitoring**: Built-in health checks and monitoring
- **✅ Quality Assurance**: Automated content validation

### Quick Start

```bash
# Clone the template
git clone https://github.com/tarverryan/template-app-agent-xcom.git
cd template-app-agent-xcom

# Navigate to bot directory
cd app/app-agent-xcom-template

# Copy environment template
cp env.example .env

# Edit configuration
nano .env

# Install dependencies
npm install

# Generate content
npm run seed-all

# Start the bot
npm run dev
```

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# Check logs
docker-compose logs -f

# Stop the bot
docker-compose down
```

### Health Monitoring

```bash
# Check bot health
curl http://localhost:3000/health

# Get statistics
curl http://localhost:3000/stats

# Manual post
curl -X POST http://localhost:3000/post
```

### Configuration

The bot is highly configurable through:

1. **Environment Variables** - API keys and basic settings
2. **Personality Configuration** - Bot personality and content themes
3. **Content Generation** - Topics, hashtags, and writing style
4. **Scheduling** - Posting frequency and timing

### Customization

#### Personality Configuration
Edit `src/config/personality.ts` to customize:
- Bot name and description
- Topics and hashtags
- Writing style and tone
- Posting schedule
- Content themes

#### Content Generation
```bash
# Generate posts for specific topics
npm run seed-topic "Technology"

# Check content quality
npm run qa

# View post statistics
npm run seed-stats
```

### Monitoring and Maintenance

#### Health Checks
- **Health Endpoint**: `GET /health`
- **Statistics**: `GET /stats`
- **Manual Post**: `POST /post`

#### Logs
```bash
# View application logs
tail -f logs/combined.log

# View error logs
tail -f logs/error.log
```

#### Docker Commands
```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs -f

# Restart bot
docker-compose restart

# Update and rebuild
docker-compose down
docker-compose up -d --build
```

### Troubleshooting

#### Common Issues

**Bot won't start:**
```bash
# Check environment variables
cat .env

# Check logs
npm run dev
```

**No posts generated:**
```bash
# Check OpenAI API key
echo $OPENAI_API_KEY

# Regenerate posts
npm run seed-all
```

**Docker issues:**
```bash
# Rebuild container
docker-compose down
docker-compose up -d --build
```

### Security

The template includes comprehensive security features:

- **Environment Variables**: Secure API key management
- **Input Validation**: All inputs validated and sanitized
- **Rate Limiting**: Built-in rate limiting to prevent abuse
- **Security Headers**: Comprehensive security headers
- **Authentication**: Optional authentication for health endpoints
- **Logging**: Comprehensive security logging

### Development

#### Local Development
```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Lint and format
npm run lint
npm run format
```

#### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run QA checks
npm run qa
```

### Production Deployment

#### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Twitter Developer Account
- OpenAI API Key

#### Deployment Steps
1. **Configure Environment**: Set up all required environment variables
2. **Generate Content**: Run `npm run seed-all` to generate posts
3. **Run QA**: Execute `npm run qa` to validate content
4. **Deploy**: Use Docker Compose for production deployment
5. **Monitor**: Set up health checks and monitoring

#### Environment Variables
```bash
# Required
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_SECRET=your_access_secret
OPENAI_API_KEY=your_openai_api_key

# Optional
BOT_NAME=your_bot_name
POSTING_SCHEDULE=0 9 * * *
NODE_ENV=production
LOG_LEVEL=info
```

### Support

For help and support:

- **Documentation**: Check the `docs/` folder
- **Issues**: Create an issue on GitHub
- **Discussions**: Use GitHub Discussions
- **Security**: Email for security issues

---

**Ready to create your own X.com bot?** 🚀

This template provides everything you need to build a professional, AI-powered X.com bot with enterprise-grade features and security.
