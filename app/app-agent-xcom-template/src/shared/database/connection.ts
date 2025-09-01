import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import { DatabaseError } from '../types';
import { DATABASE_SCHEMA, DATABASE_INDEXES, DATABASE_TRIGGERS, DATABASE_VIEWS } from './schema';

export class DatabaseConnection {
  private db: sqlite3.Database;
  private isInitialized = false;

  constructor(private dbPath: string) {
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        throw new DatabaseError(`Failed to connect to database at ${dbPath}`, { error: err.message });
      }
    });

    // Enable foreign keys
    this.db.run('PRAGMA foreign_keys = ON');
    
    // Enable WAL mode for better concurrency
    this.db.run('PRAGMA journal_mode = WAL');
    
    // Set busy timeout
    this.db.configure('busyTimeout', 30000);
  }

  /**
   * Initialize database schema, indexes, triggers, and views
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Create tables
      for (const [tableName, schema] of Object.entries(DATABASE_SCHEMA)) {
        await this.run(schema);
      }

      // Create indexes
      for (const index of DATABASE_INDEXES) {
        await this.run(index);
      }

      // Create triggers
      for (const trigger of DATABASE_TRIGGERS) {
        await this.run(trigger);
      }

      // Create views
      for (const view of DATABASE_VIEWS) {
        await this.run(view);
      }

      this.isInitialized = true;
    } catch (error) {
      throw new DatabaseError('Failed to initialize database schema', { error });
    }
  }

  /**
   * Execute a SQL statement with parameters
   */
  async run(sql: string, params: any[] = []): Promise<sqlite3.RunResult> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(new DatabaseError(`Database run error: ${err.message}`, { 
            sql, 
            params, 
            error: err 
          }));
        } else {
          resolve(this);
        }
      });
    });
  }

  /**
   * Execute a SQL query and return all rows
   */
  async all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(new DatabaseError(`Database query error: ${err.message}`, { 
            sql, 
            params, 
            error: err 
          }));
        } else {
          resolve(rows as T[]);
        }
      });
    });
  }

  /**
   * Execute a SQL query and return the first row
   */
  async get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(new DatabaseError(`Database get error: ${err.message}`, { 
            sql, 
            params, 
            error: err 
          }));
        } else {
          resolve(row as T | undefined);
        }
      });
    });
  }

  /**
   * Execute multiple SQL statements in a transaction
   */
  async transaction<T>(callback: (db: DatabaseConnection) => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run('BEGIN TRANSACTION');
        
        callback(this)
          .then((result) => {
            this.db.run('COMMIT', (err) => {
              if (err) {
                reject(new DatabaseError('Failed to commit transaction', { error: err }));
              } else {
                resolve(result);
              }
            });
          })
          .catch((error) => {
            this.db.run('ROLLBACK', () => {
              reject(error);
            });
          });
      });
    });
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          reject(new DatabaseError('Failed to close database connection', { error: err }));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    totalPosts: number;
    usedPosts: number;
    availablePosts: number;
    totalBots: number;
  }> {
    const stats = await this.get(`
      SELECT 
        COUNT(*) as totalPosts,
        SUM(CASE WHEN used = 1 THEN 1 ELSE 0 END) as usedPosts,
        SUM(CASE WHEN used = 0 THEN 1 ELSE 0 END) as availablePosts,
        COUNT(DISTINCT bot_id) as totalBots
      FROM posts
    `);

    return {
      totalPosts: stats?.totalPosts || 0,
      usedPosts: stats?.usedPosts || 0,
      availablePosts: stats?.availablePosts || 0,
      totalBots: stats?.totalBots || 0,
    };
  }

  /**
   * Backup database to a file
   */
  async backup(backupPath: string): Promise<void> {
    // TODO: Implement backup functionality
    // For now, just copy the database file
    const fs = require('fs');
    const path = require('path');
    
    return new Promise((resolve, reject) => {
      try {
        fs.copyFileSync(this.dbPath, backupPath);
        resolve();
      } catch (err) {
        reject(new DatabaseError('Failed to backup database', { error: err }));
      }
    });
  }

  /**
   * Check if database is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.get('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}

// Singleton instance for the application
let dbInstance: DatabaseConnection | null = null;

export function getDatabase(dbPath: string): DatabaseConnection {
  if (!dbInstance) {
    dbInstance = new DatabaseConnection(dbPath);
  }
  return dbInstance;
}

export async function initializeDatabase(dbPath: string): Promise<DatabaseConnection> {
  const db = getDatabase(dbPath);
  await db.initialize();
  return db;
}
