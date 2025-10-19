#!/usr/bin/env node

console.log('🔍 Testing AI Service Import\n');

import { aiService } from './server/services/aiService.js';

console.log('aiService imported');
console.log('isValid:', aiService.isValid);
console.log('provider:', aiService.config.provider);

async function testAIService() {
  try {
    const response = await aiService.generateResponse("Hello", "You are a helpful assistant.");
    console.log('Response:', response);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAIService();
