#!/usr/bin/env node

import { AIService } from './server/services/aiService.js';

console.log('🔍 Debug AI Service Instance\n');

// Test 1: Direct instantiation
console.log('📋 Test 1: Direct instantiation');
const aiService1 = new AIService();
console.log(`isValid: ${aiService1.isValid}`);
console.log(`Provider: ${aiService1.config.provider}`);

// Test 2: Another instance
console.log('\n📋 Test 2: Another instance');
const aiService2 = new AIService();
console.log(`isValid: ${aiService2.isValid}`);
console.log(`Provider: ${aiService2.config.provider}`);

// Test 3: Check if they're the same
console.log('\n📋 Test 3: Instance comparison');
console.log(`Same instance: ${aiService1 === aiService2}`);
console.log(`Same isValid: ${aiService1.isValid === aiService2.isValid}`);

// Test 4: Check validation logic
console.log('\n📋 Test 4: Validation logic');
import { validateAIConfig } from './server/config/ai.js';
const validationResult = validateAIConfig();
console.log(`Direct validation: ${validationResult}`);

// Test 5: Check if there's caching issue
console.log('\n📋 Test 5: Re-validate');
aiService1.isValid = validateAIConfig();
console.log(`After re-validation: ${aiService1.isValid}`);
