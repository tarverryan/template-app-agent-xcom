# API Documentation

The X.com Bot Template provides a RESTful API for monitoring, controlling, and managing the bot. All endpoints are served through an Express.js server running on port 3000 (exposed as 3001 on the host).

## 🚀 Quick Start

### Health Check
```bash
curl http://localhost:3001/health
```

### Manual Post
```bash
curl -X POST http://localhost:3001/post
```

### Statistics
```bash
curl http://localhost:3001/stats
```

## 📋 API Endpoints

### GET /health
Returns the overall health status of the bot.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "bot": {
    "name": "template-bot",
    "personality": "Customizable bot personality",
    "status": "running",
    "lastPost": "2024-01-01T00:00:00.000Z",
    "nextPost": "2024-01-01T09:00:00.000Z"
  },
  "services": {
    "database": "healthy",
    "twitter": "healthy",
    "openai": "healthy"
  }
}
```

### POST /post
Triggers a manual post to X.com.

**Response:**
```json
{
  "success": true,
  "message": "Post published successfully",
  "postId": "1234567890",
  "content": "Your post content here",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### GET /stats
Returns bot statistics and metrics.

**Response:**
```json
{
  "bot": {
    "name": "template-bot",
    "personality": "Customizable bot personality",
    "totalPosts": 150,
    "remainingPosts": 50,
    "lastPostAt": "2024-01-01T00:00:00.000Z",
    "lastReplenishmentAt": "2024-01-01T00:00:00.000Z"
  },
  "performance": {
    "averageResponseTime": 250,
    "successRate": 99.5,
    "errorRate": 0.5
  },
  "content": {
    "topics": 32,
    "hashtags": 15,
    "emojis": 10
  }
}
```

## 🔧 Configuration

### Environment Variables
```bash
# Bot Configuration
BOT_NAME=your_bot_name
BOT_PERSONALITY=your_bot_personality
POSTING_SCHEDULE=0 9 * * *

# API Configuration
HEALTH_CHECK_PORT=3000
API_RATE_LIMIT=100
API_TIMEOUT=30000

# Security
API_AUTH_ENABLED=false
API_AUTH_TOKEN=your_auth_token
```

### Docker Configuration
```yaml
services:
  template-bot:
    ports:
      - "3001:3000"
    environment:
      - HEALTH_CHECK_PORT=3000
      - API_RATE_LIMIT=100
```

## 🔒 Security

### Rate Limiting
- Default: 100 requests per 15 minutes
- Configurable via `API_RATE_LIMIT` environment variable

### Authentication (Optional)
Enable API authentication by setting:
```bash
API_AUTH_ENABLED=true
API_AUTH_TOKEN=your_secure_token
```

Then include the token in requests:
```bash
curl -H "Authorization: Bearer your_secure_token" http://localhost:3001/health
```

### CORS Configuration
The API includes CORS headers for web applications:
```javascript
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));
```

## 📊 Monitoring

### Health Check Monitoring
```bash
# Check health every 30 seconds
watch -n 30 curl -s http://localhost:3001/health | jq '.status'
```

### Log Monitoring
```bash
# Monitor API logs
tail -f logs/api.log | grep "POST /post"
```

### Performance Monitoring
```bash
# Check response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3001/health
```

## 🛠️ Development

### Local Development
```bash
# Start the bot with API
npm run dev

# Test endpoints
curl http://localhost:3000/health
curl -X POST http://localhost:3000/post
```

### Testing
```bash
# Run API tests
npm run test:api

# Test specific endpoint
npm run test:health
```

## 📝 Error Handling

### Common Error Responses

**400 Bad Request**
```json
{
  "error": "Invalid request",
  "message": "Missing required parameters",
  "status": 400
}
```

**429 Too Many Requests**
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests, please try again later",
  "status": 429
}
```

**500 Internal Server Error**
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred",
  "status": 500
}
```

## 🔄 Webhooks

### Webhook Configuration
Configure webhooks for real-time notifications:

```bash
WEBHOOK_URL=https://your-webhook-url.com/bot-events
WEBHOOK_SECRET=your_webhook_secret
```

### Webhook Events
- `post.published` - When a post is successfully published
- `post.failed` - When a post fails to publish
- `bot.started` - When the bot starts
- `bot.stopped` - When the bot stops
- `health.check` - Periodic health check results

## 📚 Examples

### Python Client
```python
import requests

class BotAPI:
    def __init__(self, base_url="http://localhost:3001"):
        self.base_url = base_url
    
    def get_health(self):
        response = requests.get(f"{self.base_url}/health")
        return response.json()
    
    def trigger_post(self):
        response = requests.post(f"{self.base_url}/post")
        return response.json()
    
    def get_stats(self):
        response = requests.get(f"{self.base_url}/stats")
        return response.json()

# Usage
bot = BotAPI()
health = bot.get_health()
print(f"Bot status: {health['status']}")
```

### JavaScript Client
```javascript
class BotAPI {
    constructor(baseURL = 'http://localhost:3001') {
        this.baseURL = baseURL;
    }
    
    async getHealth() {
        const response = await fetch(`${this.baseURL}/health`);
        return response.json();
    }
    
    async triggerPost() {
        const response = await fetch(`${this.baseURL}/post`, {
            method: 'POST'
        });
        return response.json();
    }
    
    async getStats() {
        const response = await fetch(`${this.baseURL}/stats`);
        return response.json();
    }
}

// Usage
const bot = new BotAPI();
bot.getHealth().then(health => {
    console.log(`Bot status: ${health.status}`);
});
```

## 🚀 Production Deployment

### Load Balancer Configuration
```nginx
upstream bot_api {
    server localhost:3001;
    server localhost:3002;
    server localhost:3003;
}

server {
    listen 80;
    server_name api.yourbot.com;
    
    location / {
        proxy_pass http://bot_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Monitoring Setup
```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'bot-api'
    static_configs:
      - targets: ['localhost:3001']
    metrics_path: '/metrics'
    scrape_interval: 30s
```

---

**Ready to integrate with your bot?** 🚀

This API provides everything you need to monitor and control your X.com bot programmatically.
