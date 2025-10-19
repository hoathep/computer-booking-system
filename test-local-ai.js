#!/usr/bin/env node

import dotenv from 'dotenv';
import { getAIConfig, validateAIConfig } from './server/config/ai.js';
import { aiService } from './server/services/aiService.js';

dotenv.config();

console.log('🧪 Testing Local AI Server Connection\n');

// Test configuration
console.log('📋 Configuration Status:');
const config = getAIConfig();
console.log(`Provider: ${config.provider}`);
console.log(`Base URL: ${config.baseURL}`);
console.log(`Model: ${config.model}`);
console.log(`API Key: ${config.apiKey || 'None (not required for local AI)'}\n`);

// Test server connectivity
console.log('🔍 Testing Server Connectivity:');
try {
  const response = await fetch(`${config.baseURL}/models`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  if (response.ok) {
    const models = await response.json();
    console.log('✅ Server is reachable');
    console.log(`📋 Available models: ${models.data?.length || 0} models`);
    if (models.data && models.data.length > 0) {
      console.log('Available models:');
      models.data.forEach(model => {
        console.log(`  - ${model.id}`);
      });
    }
  } else {
    console.log(`❌ Server responded with status: ${response.status}`);
    console.log(`Response: ${await response.text()}`);
  }
} catch (error) {
  console.log(`❌ Cannot connect to server: ${error.message}`);
  console.log('💡 Please check:');
  console.log('  1. Server is running at http://10.73.135.29/v1');
  console.log('  2. Network connectivity');
  console.log('  3. Firewall settings');
}

console.log('\n🤖 Testing AI Service:');
try {
  const testMessage = 'Xin chào, bạn có thể giúp tôi gì về Computer Booking System?';
  console.log(`Test message: "${testMessage}"`);
  
  const response = await aiService.generateResponse(testMessage, 'You are a helpful assistant.');
  console.log(`Response: ${response.substring(0, 200)}...`);
  
  if (response.includes('Fallback Mode')) {
    console.log('⚠️ AI Service is using fallback mode');
  } else {
    console.log('✅ AI Service is working with Local AI server');
  }
} catch (error) {
  console.error('❌ AI Service error:', error.message);
}

console.log('\n📖 Configuration Summary:');
console.log(`Server URL: ${config.baseURL}`);
console.log(`Model: ${config.model}`);
console.log(`Provider: ${config.provider}`);
