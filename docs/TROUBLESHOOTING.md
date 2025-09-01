# Troubleshooting Guide - X.com Bot Template

Common issues and solutions for the X.com Bot Template.

## 🚨 Common Issues

### Bot Won't Start

#### Issue: Container fails to start
```bash
Error: Cannot find module 'dist/index.js'
```

**Solution:**
```bash
# Build the project first
npm run build

# Then start the container
docker-compose up -d
```

#### Issue: Environment variables not loaded
```bash
Error: Missing required environment variable: TWITTER_API_KEY
```

**Solution:**
```bash
# Copy environment template
cp app/app-agent-xcom-template/env.example app/app-agent-xcom-template/.env

# Edit with your API keys
nano app/app-agent-xcom-template/.env
```

#### Issue: Database connection failed
```bash
Error: SQLITE_CANTOPEN: unable to open database file
```

**Solution:**
```bash
# Create data directory
mkdir -p app/app-agent-xcom-template/data

# Set proper permissions
chmod 755 app/app-agent-xcom-template/data

# Restart container
docker-compose restart
```

### API Issues

#### Issue: Twitter API authentication failed
```bash
Error: 401 Unauthorized
```

**Solution:**
1. Verify your Twitter API credentials
2. Check that your Twitter app has the correct permissions
3. Ensure your API keys are properly formatted
4. Verify your Twitter account is not suspended

#### Issue: OpenAI API quota exceeded
```bash
Error: You exceeded your current quota
```

**Solution:**
1. Check your OpenAI account billing
2. Upgrade your OpenAI plan if needed
3. Reduce the number of content generation requests
4. Use a different OpenAI model

#### Issue: Rate limit exceeded
```bash
Error: Rate limit exceeded
```

**Solution:**
1. Wait for rate limit reset (usually 15 minutes)
2. Reduce posting frequency
3. Implement exponential backoff
4. Check your API usage limits

### Content Generation Issues

#### Issue: No posts being generated
```bash
Warning: No posts available for posting
```

**Solution:**
```bash
# Seed the database with posts
npm run seed-all

# Or generate specific topic posts
npm run seed-topic technology 50
```

#### Issue: Generated content is poor quality
```bash
Posts seem generic or low quality
```

**Solution:**
1. Improve your personality configuration
2. Add more specific topics
3. Refine your writing style prompts
4. Use a better OpenAI model

#### Issue: Content is too long/short
```bash
Posts exceed Twitter character limit
```

**Solution:**
1. Adjust `postLength` in personality config
2. Update content generation prompts
3. Add content validation rules
4. Use content truncation

### Performance Issues

#### Issue: Slow response times
```bash
Health check takes > 5 seconds
```

**Solution:**
1. Check database performance
2. Optimize API calls
3. Add caching layer
4. Scale container resources

#### Issue: High memory usage
```bash
Container using > 512MB memory
```

**Solution:**
1. Check for memory leaks
2. Optimize database queries
3. Reduce concurrent operations
4. Increase container memory limit

#### Issue: High CPU usage
```bash
Container using > 50% CPU
```

**Solution:**
1. Optimize content generation
2. Reduce API call frequency
3. Add request caching
4. Scale horizontally

### Database Issues

#### Issue: Database corruption
```bash
Error: database disk image is malformed
```

**Solution:**
```bash
# Stop the bot
docker-compose stop

# Backup current database
cp app/app-agent-xcom-template/data/template-bot.db backup/

# Restore from backup
cp backup/template-bot.db app/app-agent-xcom-template/data/

# Restart bot
docker-compose up -d
```

#### Issue: Database locked
```bash
Error: database is locked
```

**Solution:**
```bash
# Stop all containers
docker-compose down

# Remove lock files
rm -f app/app-agent-xcom-template/data/*.db-lock

# Restart containers
docker-compose up -d
```

#### Issue: Database full
```bash
Error: database or disk is full
```

**Solution:**
1. Clean up old logs
2. Archive old posts
3. Increase disk space
4. Implement data retention policy

### Network Issues

#### Issue: Cannot connect to external APIs
```bash
Error: connect ECONNREFUSED
```

**Solution:**
1. Check internet connectivity
2. Verify firewall settings
3. Check DNS resolution
4. Test API endpoints manually

#### Issue: SSL/TLS errors
```bash
Error: unable to verify the first certificate
```

**Solution:**
1. Update CA certificates
2. Check system time
3. Verify SSL configuration
4. Use HTTP for testing (not recommended for production)

## 🔧 Debugging Commands

### Check Bot Status
```bash
# Check health
curl http://localhost:3001/health

# Check statistics
curl http://localhost:3001/stats

# Check logs
docker-compose logs -f
```

### Database Debugging
```bash
# Check database integrity
sqlite3 app/app-agent-xcom-template/data/template-bot.db "PRAGMA integrity_check;"

# Check database size
ls -lh app/app-agent-xcom-template/data/template-bot.db

# Check table structure
sqlite3 app/app-agent-xcom-template/data/template-bot.db ".schema"
```

### Container Debugging
```bash
# Check container status
docker ps -a

# Check container resources
docker stats

# Access container shell
docker exec -it template-bot sh

# Check container logs
docker logs template-bot --tail=100
```

### Network Debugging
```bash
# Test API connectivity
curl -H "Authorization: Bearer YOUR_TOKEN" https://api.twitter.com/2/users/me

# Check DNS resolution
nslookup api.twitter.com

# Test port connectivity
telnet localhost 3001
```

## 📊 Monitoring and Alerts

### Health Check Monitoring
```bash
# Set up monitoring script
#!/bin/bash
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health)
if [ $response -ne 200 ]; then
    echo "Bot health check failed: $response"
    # Send alert
fi
```

### Log Monitoring
```bash
# Monitor for errors
tail -f app/app-agent-xcom-template/logs/combined.log | grep ERROR

# Monitor for warnings
tail -f app/app-agent-xcom-template/logs/combined.log | grep WARN
```

### Performance Monitoring
```bash
# Monitor response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3001/health

# Monitor resource usage
docker stats --no-stream template-bot
```

## 🆘 Getting Help

### Before Asking for Help

1. **Check the logs** - Look for error messages
2. **Verify configuration** - Ensure all settings are correct
3. **Test manually** - Try the failing operation manually
4. **Check documentation** - Review relevant documentation
5. **Search issues** - Look for similar issues in GitHub

### When Asking for Help

Include the following information:

1. **Error message** - Copy the exact error
2. **Environment details** - OS, Node.js version, Docker version
3. **Configuration** - Relevant config files (without secrets)
4. **Steps to reproduce** - Clear steps to reproduce the issue
5. **What you've tried** - List of attempted solutions

### Support Channels

- **GitHub Issues** - For bug reports and feature requests
- **GitHub Discussions** - For questions and community support
- **Documentation** - Check the comprehensive documentation
- **Examples** - Review the examples and templates

## 🔄 Recovery Procedures

### Complete Reset
```bash
# Stop all containers
docker-compose down

# Remove all data
rm -rf app/app-agent-xcom-template/data/*
rm -rf app/app-agent-xcom-template/logs/*

# Rebuild containers
docker-compose build --no-cache

# Start fresh
docker-compose up -d

# Seed database
npm run seed-all
```

### Partial Reset
```bash
# Reset only posts
npm run clear

# Regenerate posts
npm run seed-all

# Restart bot
docker-compose restart
```

### Configuration Reset
```bash
# Backup current config
cp app/app-agent-xcom-template/.env app/app-agent-xcom-template/.env.backup

# Reset to defaults
cp app/app-agent-xcom-template/env.example app/app-agent-xcom-template/.env

# Edit with your settings
nano app/app-agent-xcom-template/.env
```

---

**Need more help?** Check the [GitHub Issues](https://github.com/tarverryan/template-app-agent-xcom/issues) or [Discussions](https://github.com/tarverryan/template-app-agent-xcom/discussions) for community support.
