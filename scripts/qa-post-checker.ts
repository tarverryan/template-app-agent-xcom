#!/usr/bin/env ts-node

/**
 * QA Post Checker for X.com Bot Template
 * 
 * This script validates all bot content for quality, compliance, and consistency.
 * It checks character limits, content uniqueness, profanity, and formatting.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as sqlite3 from 'sqlite3';

interface QAReport {
  botName: string;
  totalPosts: number;
  errors: {
    characterLimit: string[];
    emptyContent: string[];
    duplicateContent: string[];
    invalidCharacters: string[];
    profanity: string[];
    incompleteSentences: string[];
    excessivePunctuation: string[];
    missingTopicSuffix: string[];
  };
  warnings: {
    shortPosts: string[];
    longPosts: string[];
    repetitivePhrases: string[];
  };
  passed: boolean;
}

class PostChecker {
  private db: sqlite3.Database;
  private profanityList: Set<string>;

  constructor(dbPath: string) {
    this.db = new sqlite3.Database(dbPath);
    this.profanityList = new Set([
      // Add common profanity words here
      'badword1', 'badword2', 'badword3'
    ]);
  }

  async checkBotPosts(botName: string): Promise<QAReport> {
    const posts = await this.getPosts(botName);
    
    const report: QAReport = {
      botName,
      totalPosts: posts.length,
      errors: {
        characterLimit: [],
        emptyContent: [],
        duplicateContent: [],
        invalidCharacters: [],
        profanity: [],
        incompleteSentences: [],
        excessivePunctuation: [],
        missingTopicSuffix: []
      },
      warnings: {
        shortPosts: [],
        longPosts: [],
        repetitivePhrases: []
      },
      passed: true
    };

    const seenContent = new Set<string>();

    for (const post of posts) {
      const content = post.content;

      // Check character limit
      if (content.length > 280) {
        report.errors.characterLimit.push(`Post ${post.id}: ${content.length} chars`);
        report.passed = false;
      }

      // Check empty content
      if (!content.trim()) {
        report.errors.emptyContent.push(`Post ${post.id}: Empty content`);
        report.passed = false;
      }

      // Check duplicates
      const normalizedContent = content.toLowerCase().trim();
      if (seenContent.has(normalizedContent)) {
        report.errors.duplicateContent.push(`Post ${post.id}: Duplicate content`);
        report.passed = false;
      }
      seenContent.add(normalizedContent);

      // Check invalid characters
      if (/[^\x00-\x7F]/.test(content)) {
        report.errors.invalidCharacters.push(`Post ${post.id}: Contains non-ASCII characters`);
        report.passed = false;
      }

      // Check profanity
      const words = content.toLowerCase().split(/\s+/);
      const profanityFound = words.some(word => this.profanityList.has(word));
      if (profanityFound) {
        report.errors.profanity.push(`Post ${post.id}: Contains profanity`);
        report.passed = false;
      }

      // Check incomplete sentences
      if (!content.match(/[.!?]$/)) {
        report.errors.incompleteSentences.push(`Post ${post.id}: Incomplete sentence`);
        report.passed = false;
      }

      // Check excessive punctuation
      if ((content.match(/[!]{2,}/g) || []).length > 0) {
        report.errors.excessivePunctuation.push(`Post ${post.id}: Excessive punctuation`);
        report.passed = false;
      }

      // Check topic suffix (for template bots)
      if (!content.includes('#') && !content.includes('@')) {
        report.errors.missingTopicSuffix.push(`Post ${post.id}: Missing hashtag or mention`);
        report.passed = false;
      }

      // Warnings
      if (content.length < 50) {
        report.warnings.shortPosts.push(`Post ${post.id}: Very short (${content.length} chars)`);
      }

      if (content.length > 250) {
        report.warnings.longPosts.push(`Post ${post.id}: Very long (${content.length} chars)`);
      }

      // Check repetitive phrases
      const phrases = this.extractPhrases(content);
      const phraseCounts = new Map<string, number>();
      phrases.forEach(phrase => {
        phraseCounts.set(phrase, (phraseCounts.get(phrase) || 0) + 1);
      });

      for (const [phrase, count] of phraseCounts) {
        if (count > 2 && phrase.length > 10) {
          report.warnings.repetitivePhrases.push(`Post ${post.id}: Repetitive phrase "${phrase}"`);
        }
      }
    }

    return report;
  }

  private async getPosts(botName: string): Promise<Array<{id: number, content: string}>> {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT id, content FROM posts WHERE bot_name = ? ORDER BY id',
        [botName],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }

  private extractPhrases(content: string): string[] {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const phrases: string[] = [];
    
    sentences.forEach(sentence => {
      const words = sentence.trim().split(/\s+/);
      for (let i = 0; i <= words.length - 3; i++) {
        phrases.push(words.slice(i, i + 3).join(' '));
      }
    });
    
    return phrases;
  }

  close(): void {
    this.db.close();
  }
}

function displayReport(report: QAReport): void {
  console.log(`\n📊 QA Report for ${report.botName}`);
  console.log(`Total Posts: ${report.totalPosts}`);
  console.log(`Status: ${report.passed ? '✅ PASSED' : '❌ FAILED'}`);

  if (report.errors.characterLimit.length > 0) {
    console.log(`\n❌ Character Limit Errors (${report.errors.characterLimit.length}):`);
    report.errors.characterLimit.slice(0, 5).forEach(error => console.log(`  - ${error}`));
  }

  if (report.errors.emptyContent.length > 0) {
    console.log(`\n❌ Empty Content Errors (${report.errors.emptyContent.length}):`);
    report.errors.emptyContent.slice(0, 5).forEach(error => console.log(`  - ${error}`));
  }

  if (report.errors.duplicateContent.length > 0) {
    console.log(`\n❌ Duplicate Content Errors (${report.errors.duplicateContent.length}):`);
    report.errors.duplicateContent.slice(0, 5).forEach(error => console.log(`  - ${error}`));
  }

  if (report.errors.invalidCharacters.length > 0) {
    console.log(`\n❌ Invalid Characters Errors (${report.errors.invalidCharacters.length}):`);
    report.errors.invalidCharacters.slice(0, 5).forEach(error => console.log(`  - ${error}`));
  }

  if (report.errors.profanity.length > 0) {
    console.log(`\n❌ Profanity Errors (${report.errors.profanity.length}):`);
    report.errors.profanity.slice(0, 5).forEach(error => console.log(`  - ${error}`));
  }

  if (report.errors.incompleteSentences.length > 0) {
    console.log(`\n❌ Incomplete Sentences Errors (${report.errors.incompleteSentences.length}):`);
    report.errors.incompleteSentences.slice(0, 5).forEach(error => console.log(`  - ${error}`));
  }

  if (report.errors.excessivePunctuation.length > 0) {
    console.log(`\n❌ Excessive Punctuation Errors (${report.errors.excessivePunctuation.length}):`);
    report.errors.excessivePunctuation.slice(0, 5).forEach(error => console.log(`  - ${error}`));
  }

  if (report.errors.missingTopicSuffix.length > 0) {
    console.log(`\n❌ Missing Topic Suffix Errors (${report.errors.missingTopicSuffix.length}):`);
    report.errors.missingTopicSuffix.slice(0, 5).forEach(error => console.log(`  - ${error}`));
  }

  if (report.warnings.shortPosts.length > 0) {
    console.log(`\n⚠️  Short Posts Warnings (${report.warnings.shortPosts.length}):`);
    report.warnings.shortPosts.slice(0, 3).forEach(warning => console.log(`  - ${warning}`));
  }

  if (report.warnings.longPosts.length > 0) {
    console.log(`\n⚠️  Long Posts Warnings (${report.warnings.longPosts.length}):`);
    report.warnings.longPosts.slice(0, 3).forEach(warning => console.log(`  - ${warning}`));
  }

  if (report.warnings.repetitivePhrases.length > 0) {
    console.log(`\n⚠️  Repetitive Phrases Warnings (${report.warnings.repetitivePhrases.length}):`);
    report.warnings.repetitivePhrases.slice(0, 3).forEach(warning => console.log(`  - ${warning}`));
  }
}

async function main(): Promise<void> {
  console.log('🔍 STARTING QA CHECK FOR X.com Bot Template');
  console.log('==========================================');

  const botName = 'app-agent-xcom-template';
  const dbPath = path.join(__dirname, '..', 'app', 'app-agent-xcom-template', 'data', 'app-agent-xcom-template.db');

  if (!fs.existsSync(dbPath)) {
    console.log(`❌ Database not found at ${dbPath}`);
    console.log('Please run the bot first to generate the database.');
    process.exit(1);
  }

  const checker = new PostChecker(dbPath);

  try {
    // Check template bot posts
    const templateReport = await checker.checkBotPosts(botName);
    displayReport(templateReport);

    // Summary
    const totalErrors = 
      templateReport.errors.characterLimit.length + templateReport.errors.emptyContent.length +
      templateReport.errors.duplicateContent.length + templateReport.errors.invalidCharacters.length +
      templateReport.errors.profanity.length + templateReport.errors.incompleteSentences.length +
      templateReport.errors.excessivePunctuation.length + templateReport.errors.missingTopicSuffix.length;

    const totalWarnings = 
      templateReport.warnings.shortPosts.length + templateReport.warnings.longPosts.length +
      templateReport.warnings.repetitivePhrases.length;

    console.log(`\n📈 SUMMARY:`);
    console.log(`Total Posts Checked: ${templateReport.totalPosts}`);
    console.log(`Total Errors: ${totalErrors}`);
    console.log(`Total Warnings: ${totalWarnings}`);
    console.log(`Overall Status: ${templateReport.passed ? '✅ PASSED' : '❌ FAILED'}`);

    if (!templateReport.passed) {
      console.log('\n❌ QA check failed. Please fix the errors above before deploying.');
      process.exit(1);
    } else {
      console.log('\n✅ QA check passed! All content is ready for deployment.');
    }

  } catch (error) {
    console.error('❌ Error during QA check:', error);
    process.exit(1);
  } finally {
    checker.close();
  }
}

if (require.main === module) {
  main().catch(console.error);
}
