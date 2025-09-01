# X.com Bot Template

[![Template](https://img.shields.io/badge/Template-Ready-blue.svg)](https://github.com/tarverryan/template-app-agent-xcom)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-green.svg)](https://github.com/features/actions)

A sophisticated X.com (Twitter) bot template with automated posting capabilities and customizable personality system.

## 🎯 Project Overview

This platform provides a template for creating X.com bots with:
- **Customizable personality** and content generation
- **Automated daily posting** at scheduled times
- **Local content generation** (no external API calls for daily posts)
- **Docker containerization** for easy deployment
- **Health monitoring** and manual controls
- **SQLite database** for efficient local storage

## 🏗️ Architecture

See the [System Architecture](./docs/diagrams/system-architecture.md) diagram for the complete system overview.

## 🚀 Current Status

### ✅ Template Ready
- **Structure:** Complete bot template with customizable personality system
- **Schedule:** Configurable daily posting times
- **Content:** Template for generating posts across multiple topics
- **Status:** **TEMPLATE READY** ✅

## 📁 Project Structure

```
template-app-agent-xcom/
├── app/
│   └── app-agent-xcom-template/     # ✅ Template & Production Ready
│       ├── src/
│       │   ├── bot.ts             # Main bot logic
│       │   ├── health.ts          # Health monitoring API
│       │   ├── services/          # Twitter, OpenAI, Post management
│       │   ├── shared/            # Database, types, utilities
│       │   ├── scripts/           # Database seeding, testing
│       │   └── __tests__/         # Comprehensive test suite
│       ├── Dockerfile             # Optimized container config
│       ├── .env.example           # Environment template
│       ├── jest.config.js         # Test configuration
│       ├── .eslintrc.js           # Linting rules
│       └── .prettierrc            # Formatting rules
├── scripts/
│   └── qa-post-checker.ts         # ✅ QA automation tool
├── docs/                          # Complete documentation
│   ├── architecture/              # System architecture and design
│   ├── api/                       # API documentation and endpoints
│   ├── deployment/                # Deployment procedures
│   ├── operations/                # Operations and monitoring
│   ├── development/               # Development guides
│   ├── bot/                       # Bot configuration and setup
│   └── content/                   # Content generation and samples
├── .github/workflows/             # CI/CD pipeline
├── docker-compose.yml             # Container orchestration
└── README.md                      # Platform overview
```

## 📚 Documentation

### Complete Documentation Suite
- **[Architecture](./docs/architecture/)** - System design and architecture
- **[API](./docs/api/)** - API documentation and endpoints
- **[Deployment](./docs/deployment/)** - Production deployment guides
- **[Operations](./docs/operations/)** - Monitoring and runbooks
- **[Development](./docs/development/)** - Development setup and guidelines
- **[Bot Configuration](./docs/bot/)** - Personality and bot setup
- **[Content System](./docs/content/)** - Content generation and samples

## 🔍 Quality Assurance

The platform includes an automated QA system to validate all bot content:

```bash
# Run QA check on all bots
npm run qa
```

**QA Checks Include:**
- ✅ Character limit compliance (280 chars)
- ✅ Content uniqueness validation
- ✅ Profanity and inappropriate content filtering
- ✅ Proper punctuation and formatting
- ✅ Topic suffix validation
- ✅ Content quality metrics

## 🛠️ Technology Stack

See the [Technology Stack](./docs/diagrams/technology-stack.md) diagram for the complete technology overview.

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)
- Twitter Developer Account with API keys
- OpenAI API key

### 1. Clone and Setup
```bash
git clone https://github.com/tarverryan/template-app-agent-xcom.git
cd template-app-agent-xcom
```

### 2. Configure Environment
```bash
# Navigate to bot directory
cd app/app-agent-xcom-template

# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

### 3. Customize Personality
```bash
# Edit personality configuration
nano src/config/personality.ts

# Generate posts for your bot
npm run seed-all

# Check post statistics
npm run seed-stats
```

### 4. Run QA Check
```bash
# From root directory
npm run qa
```

### 5. Deploy with Docker
```bash
# Build and run individual bot
npm run docker:build
npm run docker:run

# Or use Docker Compose for all bots
docker-compose up -d
```

## 📊 Bot Personalities

### 🎭 Customizable Bot Template
- **Voice:** Configurable personality and tone
- **Topics:** Customizable topic categories
- **Style:** Adjustable writing style and content themes

## 🔧 Development

### Local Development
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

### Adding New Bots
1. Copy the template directory as a starting point
2. Update personality configuration
3. Generate posts with `npm run seed-all`
4. Run QA check with `npm run qa`
5. Deploy with Docker

## 📈 Monitoring

Each bot provides health endpoints:
- `GET /health` - Bot status and service health
- `GET /stats` - Post statistics and usage
- `POST /post` - Manual post trigger

## 🤝 Contributing

1. Follow the established patterns from the template
2. Ensure all tests pass
3. Run QA checks on content
4. Update documentation
5. Follow enterprise standards

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Status:** 🟢 **TEMPLATE READY FOR CUSTOMIZATION**

**Last Updated:** January 2025
