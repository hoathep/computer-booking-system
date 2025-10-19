#!/usr/bin/env node

import { getAIConfig, validateAIConfig } from './server/config/ai.js';

console.log('🔍 Debug AI Configuration\n');

const config = getAIConfig();
console.log('📋 AI Config:');
console.log(JSON.stringify(config, null, 2));

console.log('\n🔍 Validation:');
const isValid = validateAIConfig();
console.log(`isValid: ${isValid}`);

console.log('\n🔍 Provider check:');
console.log(`Provider: ${config.provider}`);
console.log(`BaseURL: ${config.baseURL}`);
console.log(`API Key: ${config.apiKey ? 'SET' : 'NOT SET'}`);

if (config.provider === 'localai') {
  console.log('\n✅ Using Local AI - should work');
} else if (config.provider === 'openai') {
  console.log('\n⚠️ Using OpenAI - needs API key');
}
