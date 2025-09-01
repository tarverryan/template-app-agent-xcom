#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { EnvironmentSchema } from '../shared/types';

interface SecretConfig {
  name: string;
  value: string;
  encrypted: boolean;
  description: string;
}

class SecretsManager {
  private readonly secretsFile: string;
  private readonly encryptionKey: string;

  constructor() {
    this.secretsFile = path.join(process.cwd(), '.secrets');
    this.encryptionKey = process.env.ENCRYPTION_KEY || this.generateEncryptionKey();
  }

  private generateEncryptionKey(): string {
    const key = crypto.randomBytes(32).toString('hex');
    console.log('🔑 Generated new encryption key. Add this to your environment:');
    console.log(`ENCRYPTION_KEY=${key}`);
    return key;
  }

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  private decrypt(encryptedText: string): string {
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  private loadSecrets(): SecretConfig[] {
    if (!fs.existsSync(this.secretsFile)) {
      return [];
    }
    
    try {
      const data = fs.readFileSync(this.secretsFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('❌ Failed to load secrets:', error);
      return [];
    }
  }

  private saveSecrets(secrets: SecretConfig[]): void {
    try {
      fs.writeFileSync(this.secretsFile, JSON.stringify(secrets, null, 2));
      // Set restrictive permissions
      fs.chmodSync(this.secretsFile, 0o600);
    } catch (error) {
      console.error('❌ Failed to save secrets:', error);
    }
  }

  public setSecret(name: string, value: string, description: string = ''): void {
    const secrets = this.loadSecrets();
    const existingIndex = secrets.findIndex(s => s.name === name);
    
    const secret: SecretConfig = {
      name,
      value: this.encrypt(value),
      encrypted: true,
      description
    };

    if (existingIndex >= 0) {
      secrets[existingIndex] = secret;
      console.log(`🔐 Updated secret: ${name}`);
    } else {
      secrets.push(secret);
      console.log(`🔐 Added secret: ${name}`);
    }

    this.saveSecrets(secrets);
  }

  public getSecret(name: string): string | null {
    const secrets = this.loadSecrets();
    const secret = secrets.find(s => s.name === name);
    
    if (!secret) {
      return null;
    }

    try {
      return this.decrypt(secret.value);
    } catch (error) {
      console.error(`❌ Failed to decrypt secret ${name}:`, error);
      return null;
    }
  }

  public listSecrets(): void {
    const secrets = this.loadSecrets();
    
    if (secrets.length === 0) {
      console.log('📝 No secrets stored');
      return;
    }

    console.log('📝 Stored secrets:');
    secrets.forEach(secret => {
      console.log(`  - ${secret.name}${secret.description ? ` (${secret.description})` : ''}`);
    });
  }

  public removeSecret(name: string): void {
    const secrets = this.loadSecrets();
    const filtered = secrets.filter(s => s.name !== name);
    
    if (filtered.length < secrets.length) {
      this.saveSecrets(filtered);
      console.log(`🗑️  Removed secret: ${name}`);
    } else {
      console.log(`❌ Secret not found: ${name}`);
    }
  }

  public generateEnvFile(): void {
    const secrets = this.loadSecrets();
    const envContent: string[] = [];

    // Add template content
    envContent.push('# Bot Configuration');
          envContent.push('BOT_NAME=template-bot');
      envContent.push('BOT_PERSONALITY=Customizable bot personality');
    envContent.push('BOT_SCHEDULE=0 9 * * *');
    envContent.push('TIMEZONE=America/Denver');
    envContent.push('');
    envContent.push('# Database Configuration');
          envContent.push('DATABASE_PATH=./data/template-bot.db');
    envContent.push('');
    envContent.push('# Twitter API v2 Credentials (OAuth 1.0a)');
    envContent.push('# Get these from https://developer.twitter.com/en/portal/dashboard');
    
    // Add secrets
    secrets.forEach(secret => {
      const value = this.getSecret(secret.name);
      if (value) {
        envContent.push(`${secret.name}=${value}`);
      }
    });

    envContent.push('');
    envContent.push('# OpenAI Configuration');
    envContent.push('# Get this from https://platform.openai.com/api-keys');
    envContent.push('OPENAI_MODEL=gpt-4');
    envContent.push('');
    envContent.push('# Content Generation');
    envContent.push('POSTS_BATCH_SIZE=2000');
    envContent.push('REPLENISHMENT_THRESHOLD=50');
    envContent.push('');
    envContent.push('# Retry Configuration');
    envContent.push('MAX_RETRIES=3');
    envContent.push('RETRY_DELAY_MS=5000');
    envContent.push('');
    envContent.push('# Logging');
    envContent.push('LOG_LEVEL=info');
    envContent.push('');
    envContent.push('# Security');
    envContent.push('NODE_ENV=production');
    envContent.push('');
    envContent.push('# Health Server');
    envContent.push('PORT=3000');
    envContent.push('');
    envContent.push('# Security Configuration (optional)');
    envContent.push('# Set ENABLE_AUTH=true to enable basic authentication');
    envContent.push('ENABLE_AUTH=false');
    envContent.push('HEALTH_USERNAME=admin');
    envContent.push('HEALTH_PASSWORD=your_secure_password_here');
    envContent.push('# Comma-separated list of allowed IPs (leave empty to allow all)');
    envContent.push('ALLOWED_IPS=127.0.0.1,::1');
    envContent.push('# Set ENABLE_IP_WHITELIST=true to enable IP whitelisting');
    envContent.push('ENABLE_IP_WHITELIST=false');

    const envPath = path.join(process.cwd(), '.env');
    fs.writeFileSync(envPath, envContent.join('\n'));
    fs.chmodSync(envPath, 0o600); // Restrictive permissions
    
    console.log('✅ Generated .env file with decrypted secrets');
  }

  public validateSecrets(): boolean {
    const secrets = this.loadSecrets();
    const requiredSecrets = [
      'TWITTER_API_KEY',
      'TWITTER_API_SECRET', 
      'TWITTER_ACCESS_TOKEN',
      'TWITTER_ACCESS_SECRET',
      'OPENAI_API_KEY'
    ];

    const missing = requiredSecrets.filter(name => 
      !secrets.find(s => s.name === name)
    );

    if (missing.length > 0) {
      console.log('❌ Missing required secrets:');
      missing.forEach(name => console.log(`  - ${name}`));
      return false;
    }

    console.log('✅ All required secrets are present');
    return true;
  }
}

// CLI interface
async function main() {
  const manager = new SecretsManager();
  const command = process.argv[2];
  const args = process.argv.slice(3);

  switch (command) {
    case 'set':
      if (args.length < 2) {
        console.log('Usage: npm run secrets set <name> <value> [description]');
        process.exit(1);
      }
      manager.setSecret(args[0], args[1], args[2] || '');
      break;

    case 'get':
      if (args.length < 1) {
        console.log('Usage: npm run secrets get <name>');
        process.exit(1);
      }
      const value = manager.getSecret(args[0]);
      if (value) {
        console.log(value);
      } else {
        console.log('❌ Secret not found');
        process.exit(1);
      }
      break;

    case 'list':
      manager.listSecrets();
      break;

    case 'remove':
      if (args.length < 1) {
        console.log('Usage: npm run secrets remove <name>');
        process.exit(1);
      }
      manager.removeSecret(args[0]);
      break;

    case 'generate-env':
      manager.generateEnvFile();
      break;

    case 'validate':
      const isValid = manager.validateSecrets();
      process.exit(isValid ? 0 : 1);
      break;

    default:
      console.log('🔐 Secrets Manager - Secure API Key Management');
      console.log('');
      console.log('Commands:');
      console.log('  set <name> <value> [description]  - Store a secret');
      console.log('  get <name>                        - Retrieve a secret');
      console.log('  list                              - List all secrets');
      console.log('  remove <name>                     - Remove a secret');
      console.log('  generate-env                      - Generate .env file');
      console.log('  validate                          - Validate required secrets');
      console.log('');
      console.log('Example:');
      console.log('  npm run secrets set TWITTER_API_KEY "your_key_here" "Twitter API Key"');
      console.log('  npm run secrets generate-env');
      console.log('');
      console.log('Security:');
      console.log('  - Secrets are encrypted with AES-256-CBC');
      console.log('  - Set ENCRYPTION_KEY environment variable for persistent encryption');
      console.log('  - .secrets file has restrictive permissions (600)');
      break;
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
}
