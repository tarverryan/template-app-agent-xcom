#!/usr/bin/env node

import { TemplatePostGenerator } from '../services/generator/post-generator';

async function testGenerator() {
  try {
    console.log('Testing Template Post Generator...\n');

    // Test generating posts for a single topic
    console.log('=== Testing Single Topic Generation ===');
    const battlePosts = TemplatePostGenerator.generateTopicPosts('battle_wisdom', 5);
    console.log(`Generated ${battlePosts.length} battle wisdom posts:`);
    battlePosts.forEach((post, index) => {
      console.log(`${index + 1}. "${post.content}" (${post.content.length} chars)`);
    });

    console.log('\n=== Testing All Posts Generation ===');
    const allPosts = TemplatePostGenerator.generateAllPosts();
    console.log(`Generated ${allPosts.length} total posts`);

    // Show topic distribution
    const topicCounts: { [key: string]: number } = {};
    allPosts.forEach(() => {
      // Extract topic from content (simplified)
      const topic = 'battle_wisdom'; // This would be more sophisticated in real implementation
      topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    });

    console.log('\nTopic Distribution:');
    Object.entries(topicCounts).forEach(([topic, count]) => {
      console.log(`  ${topic}: ${count} posts`);
    });

    // Show character count distribution
    const charCounts: { [key: string]: number } = {};
    allPosts.forEach(post => {
      const length = post.content.length;
      if (length <= 60) charCounts['Short (40-60)'] = (charCounts['Short (40-60)'] || 0) + 1;
      else if (length <= 90) charCounts['Medium (61-90)'] = (charCounts['Medium (61-90)'] || 0) + 1;
      else charCounts['Long (91-130)'] = (charCounts['Long (91-130)'] || 0) + 1;
    });

    console.log('\nCharacter Count Distribution:');
    Object.entries(charCounts).forEach(([range, count]) => {
      console.log(`  ${range}: ${count} posts`);
    });

    console.log('\n=== Testing Content Hash Generation ===');
    const testContent = "You have to be realistic about these things.";
    const hash = TemplatePostGenerator.generateContentHash(testContent);
    console.log(`Content: "${testContent}"`);
    console.log(`Hash: ${hash}`);

    console.log('\n=== Testing Random Topic Selection ===');
    for (let i = 0; i < 5; i++) {
      const randomTopic = TemplatePostGenerator.getRandomTopic();
      console.log(`Random topic ${i + 1}: ${randomTopic}`);
    }

    console.log('\n✅ All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testGenerator();
