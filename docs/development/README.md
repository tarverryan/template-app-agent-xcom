# Development Guide - X.com Bot Template

This guide provides comprehensive information for developers working with the X.com Bot Template. It covers setup, architecture, development workflows, and best practices.

## 🚀 Quick Start

### Prerequisites
- **Node.js**: 18.x or higher
- **Docker**: 20.x or higher
- **Git**: Latest version
- **GitHub Account**: For API access

### Local Development Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/tarverryan/template-app-agent-xcom.git
   cd template-app-agent-xcom
   ```

2. **Environment Configuration**
   ```bash
   cp app/app-agent-xcom-template/.env.example app/app-agent-xcom-template/.env
   # Edit .env with your API keys
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Start Development Environment**
   ```bash
   docker-compose up -d
   ```

5. **Verify Setup**
   ```bash
   curl http://localhost:3001/health
   ```

## 🏗️ Architecture Overview

### Project Structure
```
template-app-agent-xcom/
├── app/
│   └── app-agent-xcom-template/     # Main bot application
│       ├── src/
│       │   ├── bot.ts              # Main bot logic
│       │   ├── health.ts           # Health monitoring API
│       │   ├── services/           # Twitter, OpenAI, Post management
│       │   ├── shared/             # Database, types, utilities
│       │   ├── scripts/            # Database seeding, testing
│       │   └── __tests__/          # Comprehensive test suite
│       ├── docs/                   # Bot-specific documentation
│       ├── Dockerfile              # Optimized container config
│       ├── .env.example            # Environment template
│       ├── jest.config.js          # Test configuration
│       ├── .eslintrc.js            # Linting rules
│       └── .prettierrc             # Formatting rules
├── scripts/
│   └── qa-post-checker.ts          # QA automation tool
├── docs/                           # Platform documentation
│   ├── README.md                   # Documentation index
│   ├── PROJECT_STATUS.md           # Current status and achievements
│   ├── ENTERPRISE_STANDARDS.md     # Quality and compliance standards
│   ├── DEPLOYMENT_CHECKLIST.md     # Deployment procedures
│   ├── RUNBOOKS.md                 # Operations runbooks
│   └── MONITORING.md               # Monitoring guide
├── .github/workflows/              # CI/CD pipeline
├── docker-compose.yml              # Container orchestration
└── README.md                       # Platform overview
```

### Core Components

1. **Bot Engine** (`src/bot.ts`)
   - Main bot orchestration
   - Scheduling and automation
   - Error handling and recovery

2. **Service Layer** (`src/services/`)
   - Twitter API integration
   - OpenAI content generation
   - Post management and database operations

3. **Shared Utilities** (`src/shared/`)
   - Database connection and management
   - Type definitions
   - Common utilities and helpers

4. **Health Monitoring** (`src/health.ts`)
   - RESTful API for monitoring
   - Health checks and statistics
   - Manual post triggering

## 🔧 Development Workflow

### Code Standards

#### TypeScript Configuration
- **Strict Mode**: Enabled for all TypeScript compilation
- **Type Safety**: 100% type coverage with no `any` types
- **Path Mapping**: Consistent import resolution with `@shared` aliases
- **Declaration Files**: Generated for all public APIs

#### Naming Conventions
- **Files**: kebab-case (`post-manager.ts`)
- **Classes**: PascalCase (`TemplateBot`)
- **Functions**: camelCase (`generatePost`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_POST_LENGTH`)
- **Interfaces**: PascalCase with `I` prefix (`IPost`)

#### Code Quality
- **ESLint**: Enterprise-grade linting with security rules
- **Prettier**: Consistent code formatting across the project
- **Pre-commit Hooks**: Automated quality checks before commits
- **Code Coverage**: Minimum 80% coverage requirement

### Testing Strategy

#### Test Framework
- **Jest**: Comprehensive unit and integration testing
- **Test Coverage**: 80% minimum coverage threshold
- **Mock Strategy**: Proper mocking of external dependencies
- **Test Environment**: Isolated test database and configurations

#### Test Categories
- **Unit Tests**: Individual function and class testing
- **Integration Tests**: Service interaction testing
- **End-to-End Tests**: Complete workflow testing
- **Performance Tests**: Load and stress testing

### Development Commands

#### Basic Development
```bash
# Install dependencies
npm install

# Start development environment
docker-compose up -d

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run type-check
```

#### Database Operations
```bash
# Seed database with posts
npm run seed-all

# Seed specific topic
npm run seed-topic battle_wisdom 63

# View database statistics
npm run stats

# Clear all posts
npm run clear
```

#### Scripts and Utilities
```bash
# Manual post trigger
npm run post

# Security audit
npm run security-audit

# Backup database
npm run backup

# Test content generation
npm run test-generator
```

## 🔒 Security Development

### Environment Management
- **Secure Storage**: All secrets stored in `.env` files (never committed)
- **Environment Templates**: `env.example` files for configuration
- **Test Environment**: Separate `.env.test` for testing
- **Validation**: Zod schemas for all environment variables

### Security Best Practices
- **Input Validation**: All inputs validated with Zod schemas
- **API Security**: OAuth 1.0a for Twitter API
- **Content Moderation**: OpenAI moderation for all generated content
- **Rate Limiting**: Respect for all API rate limits
- **Container Security**: Non-root user execution

### Security Testing
```bash
# Run security audit
npm run security-audit

# Check for vulnerabilities
npm audit

# Container security scan
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image template-bot:latest
```

## 📊 Monitoring and Debugging

### Health Monitoring
```bash
# Check bot health
curl http://localhost:3001/health

# Get statistics
curl http://localhost:3001/stats

# Trigger manual post
curl -X POST http://localhost:3001/post
```

### Logging
```bash
# View application logs
docker logs template-bot

# View specific log levels
docker logs template-bot | grep ERROR

# Follow logs in real-time
docker logs -f template-bot
```

### Database Operations
```bash
# Check database integrity
sqlite3 app/app-agent-xcom-template/data/template-bot.db "PRAGMA integrity_check;"

# View database statistics
sqlite3 app/app-agent-xcom-template/data/template-bot.db "PRAGMA stats;"

# Backup database
cp app/app-agent-xcom-template/data/template-bot.db backup/template-bot-$(date +%Y%m%d).db
```

### Debugging
```bash
# Access container shell
docker exec -it template-bot sh

# View real-time logs
tail -f app/app-agent-xcom-template/logs/combined.log

# Check environment variables
docker exec template-bot env

# Test database connection
docker exec template-bot node -e "console.log(require('./dist/shared').initializeDatabase())"
```

## 🚀 Deployment Development

### Local Testing
```bash
# Build production image
docker build -t template-bot:latest app/app-agent-xcom-template/

# Run production container
docker run -d --name template-bot-test -p 3001:3000 template-bot:latest

# Test production deployment
curl http://localhost:3001/health
```

### CI/CD Development
```bash
# Run CI checks locally
npm run ci

# Test Docker build
docker build -t template-bot:test app/app-agent-xcom-template/

# Run security scans
npm run security-scan

# Test deployment scripts
npm run deploy:test
```

## 📚 Documentation Development

### Documentation Standards
- **README Files**: Clear setup and usage instructions
- **API Documentation**: Complete API reference
- **Code Comments**: Inline documentation for complex logic
- **Architecture Diagrams**: Visual documentation of system design

### Documentation Commands
```bash
# Generate API documentation
npm run docs:generate

# Validate documentation links
npm run docs:validate

# Build documentation site
npm run docs:build
```

## 🤝 Contributing

### Development Process
1. **Fork Repository**: Create your own fork
2. **Create Branch**: Feature branch from main
3. **Make Changes**: Follow coding standards
4. **Test Changes**: Run all tests and checks
5. **Submit PR**: Create pull request with description

### Code Review Process
- **Automated Checks**: CI/CD pipeline validation
- **Peer Review**: Required code review process
- **Security Review**: Security-focused code review
- **Performance Review**: Performance impact assessment

### Quality Gates
- **Test Coverage**: Minimum 80% coverage required
- **Security Scan**: No critical vulnerabilities
- **Performance Tests**: Response time requirements
- **Integration Tests**: End-to-end functionality

## 🔧 Troubleshooting

### Common Issues

#### Database Issues
```bash
# Reset database
rm app/app-agent-xcom-template/data/template-bot.db
npm run seed-all
```

#### Container Issues
```bash
# Rebuild container
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

#### API Issues
```bash
# Test API connectivity
curl -H "Authorization: Bearer YOUR_TOKEN" https://api.twitter.com/2/users/me

# Check rate limits
curl -H "Authorization: Bearer YOUR_TOKEN" https://api.twitter.com/2/users/me -v
```

#### Performance Issues
```bash
# Monitor resource usage
docker stats template-bot

# Check memory usage
docker exec template-bot ps aux

# Analyze database performance
sqlite3 app/app-agent-xcom-template/data/template-bot.db "PRAGMA stats;"
```

## 📞 Support and Resources

### Getting Help
- **Documentation**: Comprehensive guides and examples
- **GitHub Issues**: Bug reports and feature requests
- **Discussions**: Community support and questions
- **Wiki**: Additional resources and tutorials

### Useful Links
- [GitHub Repository](https://github.com/tarverryan/template-app-agent-xcom)
- [GitHub Issues](https://github.com/tarverryan/template-app-agent-xcom/issues)
- [GitHub Discussions](https://github.com/tarverryan/template-app-agent-xcom/discussions)
- [Documentation](https://github.com/tarverryan/template-app-agent-xcom/tree/main/docs)

---

**Ready to build amazing bots?** 🚀

This development guide provides everything you need to work with the X.com Bot Template effectively and efficiently.
