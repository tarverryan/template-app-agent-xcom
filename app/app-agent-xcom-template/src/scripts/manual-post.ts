#!/usr/bin/env node

import * as dotenv from 'dotenv';
import { TemplateBot } from '../bot';
import { initializeDatabase } from '../shared/database/connection';

// Load environment variables
dotenv.config();

async function manualPost() {
  try {
    console.log('🚀 Triggering manual post for X.com Bot Template...\n');

    // Initialize database
    const dbPath = process.env.DATABASE_PATH || './data/template-bot.db';
    const db = await initializeDatabase(dbPath);
    
    // Create bot instance
    const bot = new TemplateBot(db);
    
    // Initialize the bot
    await bot.initialize();
    
    console.log('✅ Bot initialized successfully');
    console.log('📝 Triggering manual post...\n');
    
    // Trigger a manual post
    await bot.manualPost();
    
    console.log('🎉 Manual post completed!');
    
    // Shutdown gracefully
    await bot.shutdown();
    
  } catch (error) {
    console.error('❌ Manual post failed:', error);
    process.exit(1);
  }
}

manualPost();
