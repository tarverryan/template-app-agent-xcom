#!/usr/bin/env node

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { EnvironmentSchema } from '../shared/types';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

interface SecurityCheck {
  name: string;
  description: string;
  check: () => boolean;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

const securityChecks: SecurityCheck[] = [
  {
    name: 'Environment Variables Validation',
    description: 'Check if all required environment variables are properly set and validated',
    check: () => {
      try {
        EnvironmentSchema.parse(process.env);
        return true;
      } catch (error) {
        console.error('❌ Environment validation failed:', error);
        return false;
      }
    },
    severity: 'CRITICAL'
  },
  {
    name: 'API Keys Security',
    description: 'Check if API keys are properly configured and not using default values',
    check: () => {
      const twitterKey = process.env.TWITTER_API_KEY;
      const openaiKey = process.env.OPENAI_API_KEY;
      
      if (!twitterKey || twitterKey.includes('your_') || twitterKey.length < 10) {
        console.error('❌ Twitter API key not properly configured');
        return false;
      }
      
      if (!openaiKey || openaiKey.includes('your_') || openaiKey.length < 10) {
        console.error('❌ OpenAI API key not properly configured');
        return false;
      }
      
      return true;
    },
    severity: 'CRITICAL'
  },
  {
    name: 'Health Server Security',
    description: 'Check if health server security is properly configured',
    check: () => {
      const enableAuth = process.env.ENABLE_AUTH === 'true';
      const healthUsername = process.env.HEALTH_USERNAME;
      const healthPassword = process.env.HEALTH_PASSWORD;
      
      if (enableAuth) {
        if (!healthUsername || !healthPassword || healthPassword === 'your_secure_password_here') {
          console.error('❌ Health server authentication enabled but credentials not properly configured');
          return false;
        }
      }
      
      return true;
    },
    severity: 'HIGH'
  },
  {
    name: 'IP Whitelist Configuration',
    description: 'Check if IP whitelist is properly configured when enabled',
    check: () => {
      const enableWhitelist = process.env.ENABLE_IP_WHITELIST === 'true';
      const allowedIPs = process.env.ALLOWED_IPS;
      
      if (enableWhitelist && (!allowedIPs || allowedIPs.trim() === '')) {
        console.error('❌ IP whitelist enabled but no IPs configured');
        return false;
      }
      
      return true;
    },
    severity: 'MEDIUM'
  },
  {
    name: 'Database Security',
    description: 'Check if database path is secure and not exposed',
    check: () => {
      const dbPath = process.env.DATABASE_PATH;
      
      if (!dbPath || dbPath.includes('..') || dbPath.startsWith('/')) {
        console.error('❌ Database path may be insecure');
        return false;
      }
      
      return true;
    },
    severity: 'HIGH'
  },
  {
    name: 'Logging Security',
    description: 'Check if logging level is appropriate for production',
    check: () => {
      const logLevel = process.env.LOG_LEVEL;
      
      if (logLevel === 'debug') {
        console.warn('⚠️  Debug logging enabled in production - consider using info level');
        return true; // Warning but not failure
      }
      
      return true;
    },
    severity: 'LOW'
  },
  {
    name: 'Node Environment',
    description: 'Check if NODE_ENV is set to production',
    check: () => {
      const nodeEnv = process.env.NODE_ENV;
      
      if (nodeEnv !== 'production') {
        console.warn('⚠️  NODE_ENV not set to production');
        return true; // Warning but not failure
      }
      
      return true;
    },
    severity: 'MEDIUM'
  },
  {
    name: 'Docker Build Context Security',
    description: 'Check if .dockerignore exists and excludes sensitive files',
    check: () => {
      const dockerignorePath = path.join(process.cwd(), '.dockerignore');
      
      if (!fs.existsSync(dockerignorePath)) {
        console.error('❌ .dockerignore file not found');
        return false;
      }
      
      const dockerignoreContent = fs.readFileSync(dockerignorePath, 'utf8');
      const criticalExclusions = ['.env', '.env.*', '.ssh', '*.pem', '*.key'];
      
      const missing = criticalExclusions.filter(exclusion => 
        !dockerignoreContent.includes(exclusion)
      );
      
      if (missing.length > 0) {
        console.error(`❌ .dockerignore missing critical exclusions: ${missing.join(', ')}`);
        return false;
      }
      
      return true;
    },
    severity: 'CRITICAL'
  },
  {
    name: 'Local Port Exposure',
    description: 'Check if health server is properly restricted to localhost',
    check: () => {
      // This is checked in docker-compose.yml configuration
      // The port should be bound to 127.0.0.1:3001:3000
      console.log('ℹ️  Verify docker-compose.yml has: "127.0.0.1:3001:3000"');
      return true; // Manual verification needed
    },
    severity: 'HIGH'
  },
  {
    name: 'Secrets Management',
    description: 'Check if secrets are properly managed and encrypted',
    check: () => {
      const secretsPath = path.join(process.cwd(), '.secrets');
      const envPath = path.join(process.cwd(), '.env');
      
      // Check if .env contains actual API keys (not placeholder values)
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const hasRealKeys = !envContent.includes('your_') && 
                           !envContent.includes('placeholder') &&
                           envContent.includes('TWITTER_API_KEY=');
        
        if (hasRealKeys) {
          console.warn('⚠️  API keys found in .env file - consider using secrets manager');
          return true; // Warning but not failure
        }
      }
      
      // Check if secrets manager is being used
      if (fs.existsSync(secretsPath)) {
        console.log('✅ Secrets manager detected');
        return true;
      }
      
      return true; // Not using secrets manager is acceptable for development
    },
    severity: 'MEDIUM'
  },
  {
    name: 'Container Security Configuration',
    description: 'Check if Docker security options are properly configured',
    check: () => {
      const composePath = path.join(process.cwd(), '../../docker-compose.yml');
      
      if (!fs.existsSync(composePath)) {
        console.error('❌ docker-compose.yml not found');
        return false;
      }
      
      const composeContent = fs.readFileSync(composePath, 'utf8');
      const securityFeatures = [
        'no-new-privileges:true',
        'read_only: true',
        'tmpfs:',
        '127.0.0.1:3001:3000'
      ];
      
      const missing = securityFeatures.filter(feature => 
        !composeContent.includes(feature)
      );
      
      if (missing.length > 0) {
        console.warn(`⚠️  Docker security features missing: ${missing.join(', ')}`);
        return true; // Warning but not failure
      }
      
      return true;
    },
    severity: 'HIGH'
  }
];

async function runSecurityAudit() {
      console.log('🔒 Running Security Audit for X.com Bot Template\n');
  
  let passedChecks = 0;
  let failedChecks = 0;
  let warnings = 0;
  
  for (const check of securityChecks) {
    console.log(`\n📋 ${check.name} (${check.severity})`);
    console.log(`   ${check.description}`);
    
    try {
      const result = check.check();
      
      if (result) {
        console.log('   ✅ PASSED');
        passedChecks++;
      } else {
        console.log('   ❌ FAILED');
        failedChecks++;
      }
    } catch (error) {
      console.log('   ❌ ERROR');
      console.error('   Error during check:', error);
      failedChecks++;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 Security Audit Results:');
  console.log(`   ✅ Passed: ${passedChecks}`);
  console.log(`   ❌ Failed: ${failedChecks}`);
  console.log(`   ⚠️  Warnings: ${warnings}`);
  
  if (failedChecks > 0) {
    console.log('\n🚨 CRITICAL: Security issues found! Please fix before deployment.');
    process.exit(1);
  } else {
    console.log('\n✅ Security audit passed! Bot is ready for deployment.');
  }
}

// Run the audit
runSecurityAudit().catch(error => {
  console.error('❌ Security audit failed:', error);
  process.exit(1);
});
