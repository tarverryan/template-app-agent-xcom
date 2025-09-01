# API Reference - X.com Bot Template

Complete API documentation for the X.com Bot Template.

## 🔗 Base URL

```
http://localhost:3001
```

## 📊 Health Endpoints

### GET /health

Returns the current health status of the bot.

**Response:**
```json
{
  "status": "healthy",
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

**Status Codes:**
- `200` - Bot is healthy
- `503` - Bot is unhealthy

### GET /stats

Returns detailed statistics about the bot.

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
  }
}
```

## 🚀 Control Endpoints

### POST /post

Triggers a manual post.

**Request:**
```json
{
  "topic": "optional-topic",
  "force": false
}
```

**Response:**
```json
{
  "success": true,
  "post": {
    "id": "post-123",
    "content": "Your post content here",
    "topic": "technology",
    "postedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Status Codes:**
- `200` - Post successful
- `400` - Invalid request
- `429` - Rate limit exceeded
- `500` - Internal error

### POST /replenish

Triggers content replenishment.

**Request:**
```json
{
  "count": 100,
  "topics": ["technology", "innovation"]
}
```

**Response:**
```json
{
  "success": true,
  "generated": 100,
  "totalPosts": 250
}
```

## 🔧 Configuration Endpoints

### GET /config

Returns current bot configuration.

**Response:**
```json
{
  "personality": {
    "name": "Template Bot",
    "description": "A customizable X.com bot template",
    "voice": "Professional and engaging",
    "topics": ["Technology", "Innovation"],
    "writingStyle": "Clear and concise",
    "tone": "Professional yet approachable",
    "schedule": "0 9 * * *",
    "postLength": {
      "min": 50,
      "max": 280
    }
  },
  "api": {
    "twitter": "configured",
    "openai": "configured"
  }
}
```

### PUT /config

Updates bot configuration.

**Request:**
```json
{
  "personality": {
    "name": "My Custom Bot",
    "topics": ["My Topic 1", "My Topic 2"],
    "schedule": "0 10 * * *"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Configuration updated successfully"
}
```

## 📈 Analytics Endpoints

### GET /analytics

Returns analytics data.

**Query Parameters:**
- `period` - Time period (day, week, month, year)
- `start` - Start date (ISO 8601)
- `end` - End date (ISO 8601)

**Response:**
```json
{
  "period": "week",
  "posts": {
    "total": 7,
    "successful": 7,
    "failed": 0,
    "successRate": 100
  },
  "engagement": {
    "likes": 150,
    "retweets": 25,
    "replies": 10
  },
  "topics": {
    "technology": 3,
    "innovation": 2,
    "leadership": 2
  }
}
```

## 🔒 Authentication

### Basic Auth (Optional)

If `ENABLE_AUTH=true` is set in environment variables:

```
Authorization: Basic base64(username:password)
```

### IP Whitelist (Optional)

If `ENABLE_IP_WHITELIST=true` is set, only IPs in `ALLOWED_IPS` can access the API.

## 📊 Rate Limiting

- **Health endpoints**: 100 requests per 15 minutes
- **Control endpoints**: 10 requests per 15 minutes
- **Analytics endpoints**: 100 requests per 15 minutes

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## 🚨 Error Responses

### Standard Error Format

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Common Error Codes

- `INVALID_REQUEST` - Invalid request parameters
- `RATE_LIMIT_EXCEEDED` - Rate limit exceeded
- `API_ERROR` - External API error
- `DATABASE_ERROR` - Database error
- `CONFIGURATION_ERROR` - Configuration error
- `AUTHENTICATION_ERROR` - Authentication failed

## 📝 Examples

### cURL Examples

**Check Health:**
```bash
curl http://localhost:3001/health
```

**Trigger Manual Post:**
```bash
curl -X POST http://localhost:3001/post \
  -H "Content-Type: application/json" \
  -d '{"topic": "technology"}'
```

**Get Analytics:**
```bash
curl "http://localhost:3001/analytics?period=week"
```

### JavaScript Examples

**Check Health:**
```javascript
const response = await fetch('http://localhost:3001/health');
const health = await response.json();
console.log(health.status);
```

**Trigger Post:**
```javascript
const response = await fetch('http://localhost:3001/post', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    topic: 'technology',
    force: false
  })
});
const result = await response.json();
```

## 🔗 Webhooks

### POST /webhook

Receives webhook notifications (if configured).

**Request:**
```json
{
  "event": "post_success",
  "data": {
    "postId": "post-123",
    "content": "Post content",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

---

**API Version:** 1.0.0  
**Last Updated:** January 2025
