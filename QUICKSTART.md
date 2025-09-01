# Quick Start Guide - X.com Bot Template

Get your X.com bot up and running in 5 minutes! 🚀

## ⚡ Super Quick Start

### 1. Clone and Setup
```bash
# Clone the template
git clone https://github.com/tarverryan/template-app-agent-xcom.git
cd template-app-agent-xcom

# Navigate to bot directory
cd app/app-agent-xcom-template

# Copy environment template
cp env.example .env
```

### 2. Configure Your Bot
```bash
# Edit environment file
nano .env

# Fill in your API keys:
# - TWITTER_API_KEY
# - TWITTER_API_SECRET  
# - TWITTER_ACCESS_TOKEN
# - TWITTER_ACCESS_SECRET
# - OPENAI_API_KEY
```

### 3. Generate Content
```bash
# Install dependencies
npm install

# Generate posts for your bot
npm run seed-all

# Check what was generated
npm run seed-stats
```

### 4. Run Your Bot
```bash
# Start in development mode
npm run dev

# Or use Docker
docker-compose up -d
```

### 5. Test Your Bot
```bash
# Check health
curl http://localhost:3000/health

# Manual post (optional)
curl -X POST http://localhost:3000/post
```

## 🎯 What You Get

✅ **Customizable Personality** - Easy-to-configure bot personality  
✅ **AI-Powered Content** - OpenAI integration for content generation  
✅ **Automated Posting** - Scheduled daily posting  
✅ **Quality Assurance** - Automated content validation  
✅ **Docker Support** - Containerized deployment  
✅ **Health Monitoring** - Built-in health checks  
✅ **Security Features** - Enterprise-grade security  

## 🔧 Customization

### Personality Configuration
Edit `src/config/personality.ts` to customize:
- Bot name and description
- Topics and hashtags
- Writing style and tone
- Posting schedule
- Content themes

### Content Generation
```bash
# Generate posts for specific topics
npm run seed-topic "Technology"

# Check content quality
npm run qa

# View post statistics
npm run seed-stats
```

## 🚀 Production Deployment

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d

# Check logs
docker-compose logs -f
```

### Manual Deployment
```bash
# Build the application
npm run build

# Start production server
npm start
```

## 📊 Monitoring

### Health Checks
- **Health Endpoint**: `GET /health`
- **Statistics**: `GET /stats`
- **Manual Post**: `POST /post`

### Logs
```bash
# View application logs
tail -f logs/combined.log

# View error logs
tail -f logs/error.log
```

## 🔍 Troubleshooting

### Common Issues

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

## 📚 Next Steps

1. **Read the Documentation**: Check the `docs/` folder for detailed guides
2. **Customize Personality**: Edit `src/config/personality.ts`
3. **Add Your Topics**: Modify the topics array for your niche
4. **Set Up Monitoring**: Configure health checks and alerts
5. **Scale Up**: Add more bots or enhance functionality

## 🆘 Need Help?

- **Documentation**: Check the `docs/` folder
- **Issues**: Create an issue on GitHub
- **Discussions**: Use GitHub Discussions
- **Security**: Email for security issues

---

**Ready to launch your X.com bot?** 🚀

Follow this guide and you'll have a fully functional, AI-powered X.com bot running in minutes!
