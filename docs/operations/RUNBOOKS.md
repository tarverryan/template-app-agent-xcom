# Operations Runbooks - X.com Bot Template

This document provides comprehensive runbooks for operating and maintaining the X.com Bot Template in production environments.

## 🚨 Emergency Response Runbooks

### Bot Failure Recovery

#### Symptoms
- Bot not posting at scheduled time
- Health check endpoint returning errors
- Container not responding
- Database connection failures

#### Immediate Actions
```bash
# 1. Check container status
docker ps -a | grep template-bot

# 2. Check container logs
docker-compose logs template-bot --tail=50

# 3. Check health endpoint
curl http://localhost:3001/health

# 4. Check container resources
docker stats template-bot
```

#### Recovery Steps
```bash
# 1. Restart the bot container
docker-compose restart template-bot

# 2. Wait for health check
sleep 30

# 3. Verify recovery
curl http://localhost:3001/health

# 4. Check logs for errors
docker-compose logs template-bot --tail=20
```

#### If Recovery Fails
```bash
# 1. Stop the container
docker-compose stop template-bot

# 2. Check database integrity
docker exec -it template-bot sqlite3 /app/data/template-bot.db "PRAGMA integrity_check;"

# 3. Restore from backup if needed
docker-compose stop template-bot
cp /backup/template-bot.db /app/data/

# 4. Restart container
docker-compose up -d template-bot
```

### Database Corruption Recovery

#### Symptoms
- Database connection errors
- SQLite integrity check failures
- Missing or corrupted data
- Application crashes on database access

#### Recovery Steps
```bash
# 1. Stop the bot
docker-compose stop template-bot

# 2. Backup current database
cp /app/data/template-bot.db /backup/corrupted-$(date +%Y%m%d-%H%M%S).db

# 3. Restore from latest backup
cp /backup/template-bot.db /app/data/

# 4. Verify integrity
sqlite3 /backup/template-bot-$(date +%Y%m%d-%H%M%S).db "PRAGMA integrity_check;"

# 5. Restart bot
docker-compose up -d template-bot
```

### API Rate Limit Recovery

#### Symptoms
- Twitter API rate limit errors
- OpenAI API quota exceeded
- 429 HTTP status codes in logs
- Bot unable to post or generate content

#### Recovery Steps
```bash
# 1. Check current rate limits
docker exec -it template-bot node -e "
const { TwitterApi } = require('twitter-api-v2');
const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});
client.v2.get('users/me').then(console.log).catch(console.error);
"

# 2. Wait for rate limit reset
echo "Rate limits reset at 12:00 AM UTC daily"

# 3. Resume normal operations
docker-compose restart template-bot
```

## 🔧 Maintenance Runbooks

### Daily Maintenance

#### Health Check
```bash
# 1. Check bot health
curl http://localhost:3001/health

# 2. Check container status
docker stats template-bot

# 3. Review error logs
docker exec -it template-bot sqlite3 /app/data/template-bot.db "SELECT COUNT(*) FROM posts;"

# 4. Check disk space
df -h /app/data
```

#### Log Review
```bash
# 1. Check for errors
docker-compose logs template-bot | grep ERROR

# 2. Check for warnings
docker-compose logs template-bot | grep WARN

# 3. Check post success rate
docker-compose logs template-bot | grep "x-rate-limit"
```

### Weekly Maintenance

#### Performance Analysis
```bash
# 1. Check resource usage trends
docker stats template-bot

# 2. Analyze database performance
docker exec -it template-bot sqlite3 /app/data/template-bot.db "PRAGMA stats;"

# 3. Optimize database
docker exec -it template-bot sqlite3 /app/data/template-bot.db "VACUUM;"
docker exec -it template-bot sqlite3 /app/data/template-bot.db "ANALYZE;"

# 4. Clean old log files
docker exec -it template-bot find /app/logs -name "*.log" -mtime +7 -delete
```

#### Security Review
```bash
# 1. Check for security updates
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image template-bot:latest

# 2. Audit dependencies
docker exec template-bot npm audit

# 3. Check file integrity
docker exec -it template-bot find /app -type f -exec sha256sum {} \;
```

### Monthly Maintenance

#### Backup Verification
```bash
# 1. Stop bot for backup
docker-compose stop template-bot

# 2. Create backup
cp /app/data/template-bot.db /backup/template-bot-$(date +%Y%m%d-%H%M%S).db

# 3. Verify backup integrity
sqlite3 /backup/template-bot-$(date +%Y%m%d-%H%M%S).db "PRAGMA integrity_check;"

# 4. Restart bot
docker-compose up -d template-bot
```

#### Configuration Review
```bash
# 1. Review environment configuration
nano apps/template-bot/.env

# 2. Check for configuration drift
docker exec template-bot env | grep -E "(TWITTER|OPENAI|BOT)"

# 3. Update configuration if needed
cd apps/template-bot
docker-compose restart template-bot
```

## 🔄 Update and Deployment Runbooks

### Application Update

#### Pre-Update Checklist
```bash
# 1. Create backup
docker-compose stop template-bot
cp /app/data/template-bot.db /backup/pre-update-$(date +%Y%m%d-%H%M%S).db

# 2. Check current version
docker exec template-bot node -e "console.log(require('./package.json').version)"

# 3. Review changelog
cat CHANGELOG.md
```

#### Update Process
```bash
# 1. Pull latest code
git pull origin main

# 2. Build new image
docker-compose build template-bot

# 3. Test new image
docker run --rm template-bot:latest node -e "console.log('Test successful')"

# 4. Deploy update
docker-compose up -d template-bot

# 5. Verify deployment
curl http://localhost:3001/health
```

#### Rollback Process
```bash
# 1. Stop current container
docker-compose stop template-bot

# 2. Restore previous image
docker tag template-bot:previous template-bot:latest

# 3. Restart with previous version
docker-compose up -d template-bot

# 4. Verify rollback
curl http://localhost:3001/health
```

### Database Migration

#### Pre-Migration Steps
```bash
# 1. Create full backup
cp /app/data/template-bot.db /backup/pre-migration-$(date +%Y%m%d-%H%M%S).db

# 2. Stop application
docker-compose stop template-bot

# 3. Verify backup integrity
sqlite3 /backup/pre-migration-$(date +%Y%m%d-%H%M%S).db "PRAGMA integrity_check;"
```

#### Migration Process
```bash
# 1. Run migration script
docker exec template-bot node scripts/migrate.js

# 2. Verify migration
docker exec template-bot sqlite3 /app/data/template-bot.db "PRAGMA integrity_check;"

# 3. Start application
docker-compose up -d template-bot

# 4. Verify functionality
curl http://localhost:3001/health
```

## 📊 Monitoring and Alerting

### Health Monitoring
```bash
# 1. Check bot status
curl http://localhost:3001/health

# 2. Check statistics
curl http://localhost:3001/stats

# 3. Monitor resource usage
docker stats template-bot

# 4. Check database status
docker exec -it template-bot sqlite3 /app/data/template-bot.db "SELECT COUNT(*) FROM posts;"
```

### Alert Thresholds
- **High Error Rate**: > 5% error rate triggers alert
- **High Response Time**: > 1000ms triggers warning
- **Low Post Count**: < 10 remaining posts triggers alert
- **Service Down**: Any service unhealthy triggers immediate alert

### Incident Response
```bash
# 1. Assess impact
curl http://localhost:3001/health
docker-compose logs template-bot --tail=50

# 2. Execute appropriate runbook
# (See specific runbooks above)

# 3. Document incident
echo "$(date): Incident description and resolution" >> /var/log/incidents.log

# 4. Update stakeholders
# Send notification to team
```

## 🔒 Security Runbooks

### Security Incident Response

#### Unauthorized Access
```bash
# 1. Isolate affected container
docker-compose stop template-bot

# 2. Preserve evidence
docker cp template-bot:/app/logs ./incident-logs-$(date +%Y%m%d-%H%M%S)
docker cp template-bot:/app/data ./incident-data-$(date +%Y%m%d-%H%M%S)

# 3. Rotate credentials
# Update all API keys and tokens

# 4. Restore from clean backup
cp /backup/clean-template-bot.db /app/data/template-bot.db

# 5. Restart with new credentials
docker-compose up -d template-bot
```

#### Data Breach Response
```bash
# 1. Stop all services
docker-compose down

# 2. Secure evidence
tar -czf incident-evidence-$(date +%Y%m%d-%H%M%S).tar.gz /app/data /app/logs

# 3. Notify security team
# Follow incident response procedures

# 4. Restore from secure backup
# Use backup from before incident

# 5. Resume operations
docker-compose up -d
```

## 📋 Operational Checklists

### Daily Operations
- [ ] Check bot health status
- [ ] Review error logs
- [ ] Verify post success rate
- [ ] Monitor resource usage
- [ ] Check API rate limits

### Weekly Operations
- [ ] Performance analysis
- [ ] Security review
- [ ] Database optimization
- [ ] Log cleanup
- [ ] Backup verification

### Monthly Operations
- [ ] Full system review
- [ ] Configuration audit
- [ ] Security updates
- [ ] Capacity planning
- [ ] Documentation updates

---

**Ready to operate your bot?** 🚀

These runbooks ensure reliable operation and quick recovery from any issues with your X.com Bot Template.
