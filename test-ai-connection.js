#!/usr/bin/env node

import { getAIConfig } from './server/config/ai.js';
import { aiService } from './server/services/aiService.js';

console.log('🧪 Testing AI Connection\n');

// Test configuration
console.log('📋 Configuration Status:');
const config = getAIConfig();
console.log(`Provider: ${config.provider}`);
console.log(`Base URL: ${config.baseURL}`);
console.log(`Model: ${config.model}`);
console.log(`API Key: ${config.apiKey || 'None'}\n`);

// Test server connectivity with timeout
console.log('🔍 Testing Server Connectivity:');
const testServer = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(`${config.baseURL}/models`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const models = await response.json();
      console.log('✅ Server is reachable');
      console.log(`📋 Available models: ${models.data?.length || 0} models`);
      if (models.data && models.data.length > 0) {
        console.log('Available models:');
        models.data.slice(0, 3).forEach(model => {
          console.log(`  - ${model.id}`);
        });
        if (models.data.length > 3) {
          console.log(`  ... and ${models.data.length - 3} more`);
        }
      }
      return true;
    } else {
      console.log(`❌ Server responded with status: ${response.status}`);
      const text = await response.text();
      console.log(`Response: ${text.substring(0, 200)}...`);
      return false;
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('⏰ Connection timeout (5 seconds)');
    } else {
      console.log(`❌ Cannot connect to server: ${error.message}`);
    }
    console.log('💡 Please check:');
    console.log('  1. Server is running at http://10.73.135.29/v1');
    console.log('  2. Network connectivity');
    console.log('  3. Firewall settings');
    console.log('  4. Server port (should be 80 or 8000)');
    return false;
  }
};

const serverReachable = await testServer();

console.log('\n🤖 Testing AI Service:');
try {
  const testMessage = 'Xin chào, bạn có thể giúp tôi gì về Computer Booking System?';
  console.log(`Test message: "${testMessage}"`);
  
  const response = await aiService.generateResponse(testMessage, 'You are a helpful assistant.');
  console.log(`Response: ${response.substring(0, 200)}...`);
  
  if (response.includes('Fallback Mode')) {
    console.log('⚠️ AI Service is using fallback mode');
  } else if (response.includes('sự cố kỹ thuật')) {
    console.log('⚠️ AI Service is using fallback due to connection error');
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
console.log(`Server Reachable: ${serverReachable ? '✅ Yes' : '❌ No'}`);

if (!serverReachable) {
  console.log('\n🔧 Troubleshooting Steps:');
  console.log('1. Verify server is running: curl http://10.73.135.29/v1/models');
  console.log('2. Check if server is on different port (8000, 8080, etc.)');
  console.log('3. Test network connectivity: ping 10.73.135.29');
  console.log('4. Check firewall settings');
}
