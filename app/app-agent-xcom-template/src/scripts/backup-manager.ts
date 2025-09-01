#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { DatabaseConnection, initializeDatabase } from '../shared/database/connection';
import { logger } from '../utils/logger';

interface BackupConfig {
  sourcePath: string;
  backupDir: string;
  retentionDays: number;
  compression: boolean;
  encryption: boolean;
  encryptionKey?: string;
}

class BackupManager {
  private config: BackupConfig;
  private db!: DatabaseConnection;

  constructor(config: BackupConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    try {
      this.db = await initializeDatabase(this.config.sourcePath);
      logger.info('Backup manager initialized', { service: 'backup-manager' });
    } catch (error) {
      logger.error('Failed to initialize backup manager', { error, service: 'backup-manager' });
      throw error;
    }
  }

  async createBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup-${timestamp}.db`;
    const backupPath = path.join(this.config.backupDir, backupFileName);

    try {
      // Ensure backup directory exists
      if (!fs.existsSync(this.config.backupDir)) {
        fs.mkdirSync(this.config.backupDir, { recursive: true });
      }

      // Create backup
      await this.db.backup(backupPath);

      // Verify backup integrity
      await this.verifyBackup(backupPath);

      // Compress if enabled
      if (this.config.compression) {
        await this.compressBackup(backupPath);
      }

      // Encrypt if enabled
      if (this.config.encryption && this.config.encryptionKey) {
        await this.encryptBackup(backupPath);
      }

      logger.info('Backup created successfully', { 
        backupPath, 
        size: fs.statSync(backupPath).size,
        service: 'backup-manager' 
      });

      return backupPath;
    } catch (error) {
      logger.error('Failed to create backup', { error, service: 'backup-manager' });
      throw error;
    }
  }

  private async verifyBackup(backupPath: string): Promise<void> {
    try {
      const backupDb = await initializeDatabase(backupPath);
      const result = await backupDb.get<{ integrity_check: string }>('PRAGMA integrity_check');
      
      if (result?.integrity_check !== 'ok') {
        throw new Error(`Backup integrity check failed: ${result?.integrity_check}`);
      }

      logger.info('Backup integrity verified', { service: 'backup-manager' });
    } catch (error) {
      logger.error('Backup verification failed', { error, service: 'backup-manager' });
      throw error;
    }
  }

  private async compressBackup(backupPath: string): Promise<void> {
    // Implementation would use zlib or similar for compression
    logger.info('Backup compression not implemented yet', { service: 'backup-manager' });
  }

  private async encryptBackup(backupPath: string): Promise<void> {
    if (!this.config.encryptionKey) {
      throw new Error('Encryption key required for backup encryption');
    }

    try {
      const data = fs.readFileSync(backupPath);
      const cipher = crypto.createCipher('aes-256-cbc', this.config.encryptionKey);
      const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
      
      fs.writeFileSync(backupPath + '.enc', encrypted);
      fs.unlinkSync(backupPath); // Remove unencrypted file
      
      logger.info('Backup encrypted successfully', { service: 'backup-manager' });
    } catch (error) {
      logger.error('Backup encryption failed', { error, service: 'backup-manager' });
      throw error;
    }
  }

  async restoreBackup(backupPath: string): Promise<void> {
    try {
      // Decrypt if needed
      if (backupPath.endsWith('.enc')) {
        backupPath = await this.decryptBackup(backupPath);
      }

      // Stop the bot gracefully (this would need to be coordinated)
      logger.info('Stopping bot for restore...', { service: 'backup-manager' });

      // Restore the database
      fs.copyFileSync(backupPath, this.config.sourcePath);

      // Verify restore
      await this.verifyBackup(this.config.sourcePath);

      logger.info('Backup restored successfully', { service: 'backup-manager' });
    } catch (error) {
      logger.error('Backup restore failed', { error, service: 'backup-manager' });
      throw error;
    }
  }

  private async decryptBackup(encryptedPath: string): Promise<string> {
    if (!this.config.encryptionKey) {
      throw new Error('Encryption key required for backup decryption');
    }

    try {
      const encryptedData = fs.readFileSync(encryptedPath);
      const decipher = crypto.createDecipher('aes-256-cbc', this.config.encryptionKey);
      const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
      
      const decryptedPath = encryptedPath.replace('.enc', '');
      fs.writeFileSync(decryptedPath, decrypted);
      
      logger.info('Backup decrypted successfully', { service: 'backup-manager' });
      return decryptedPath;
    } catch (error) {
      logger.error('Backup decryption failed', { error, service: 'backup-manager' });
      throw error;
    }
  }

  async cleanupOldBackups(): Promise<void> {
    try {
      const files = fs.readdirSync(this.config.backupDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

      let deletedCount = 0;
      for (const file of files) {
        const filePath = path.join(this.config.backupDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath);
          deletedCount++;
          logger.info('Deleted old backup', { file, service: 'backup-manager' });
        }
      }

      logger.info('Backup cleanup completed', { 
        deletedCount, 
        retentionDays: this.config.retentionDays,
        service: 'backup-manager' 
      });
    } catch (error) {
      logger.error('Backup cleanup failed', { error, service: 'backup-manager' });
      throw error;
    }
  }

  async listBackups(): Promise<string[]> {
    try {
      const files = fs.readdirSync(this.config.backupDir);
      const backups = files
        .filter(file => file.startsWith('backup-') && (file.endsWith('.db') || file.endsWith('.enc')))
        .map(file => path.join(this.config.backupDir, file))
        .sort((a, b) => fs.statSync(b).mtime.getTime() - fs.statSync(a).mtime.getTime());

      return backups;
    } catch (error) {
      logger.error('Failed to list backups', { error, service: 'backup-manager' });
      throw error;
    }
  }

  async getBackupInfo(backupPath: string): Promise<{
    size: number;
    created: Date;
    encrypted: boolean;
    compressed: boolean;
  }> {
    try {
      const stats = fs.statSync(backupPath);
      return {
        size: stats.size,
        created: stats.mtime,
        encrypted: backupPath.endsWith('.enc'),
        compressed: false, // Would check for compression
      };
    } catch (error) {
      logger.error('Failed to get backup info', { error, service: 'backup-manager' });
      throw error;
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const config: BackupConfig = {
          sourcePath: process.env.DATABASE_PATH || './data/template-bot.db',
    backupDir: process.env.BACKUP_DIR || './backups',
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
    compression: process.env.BACKUP_COMPRESSION === 'true',
    encryption: process.env.BACKUP_ENCRYPTION === 'true',
    encryptionKey: process.env.BACKUP_ENCRYPTION_KEY,
  };

  const backupManager = new BackupManager(config);

  try {
    await backupManager.initialize();

    switch (command) {
      case 'create':
        const backupPath = await backupManager.createBackup();
        console.log(`✅ Backup created: ${backupPath}`);
        break;

      case 'restore':
        const backupPathToRestore = args[1];
        if (!backupPathToRestore) {
          console.error('❌ Backup path required for restore');
          process.exit(1);
        }
        await backupManager.restoreBackup(backupPathToRestore);
        console.log('✅ Backup restored successfully');
        break;

      case 'list':
        const backups = await backupManager.listBackups();
        console.log('📋 Available backups:');
        for (const backup of backups) {
          const info = await backupManager.getBackupInfo(backup);
          console.log(`  ${path.basename(backup)} (${info.size} bytes, ${info.created.toISOString()})`);
        }
        break;

      case 'cleanup':
        await backupManager.cleanupOldBackups();
        console.log('✅ Old backups cleaned up');
        break;

      case 'info':
        const backupPathForInfo = args[1];
        if (!backupPathForInfo) {
          console.error('❌ Backup path required for info');
          process.exit(1);
        }
        const info = await backupManager.getBackupInfo(backupPathForInfo);
        console.log('📊 Backup info:', info);
        break;

      default:
        console.log(`
🔧 Backup Manager Usage:

  npm run backup create     - Create a new backup
  npm run backup restore <path> - Restore from backup
  npm run backup list       - List available backups
  npm run backup cleanup    - Clean up old backups
  npm run backup info <path> - Get backup information

Environment Variables:
  DATABASE_PATH            - Source database path
  BACKUP_DIR              - Backup directory
  BACKUP_RETENTION_DAYS   - Days to retain backups
  BACKUP_COMPRESSION      - Enable compression (true/false)
  BACKUP_ENCRYPTION       - Enable encryption (true/false)
  BACKUP_ENCRYPTION_KEY   - Encryption key
        `);
    }
  } catch (error) {
    console.error('❌ Backup operation failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
}
