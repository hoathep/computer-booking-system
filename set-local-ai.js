#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Set environment variables for Local AI
process.env.AI_PROVIDER = 'localai';
process.env.LOCAL_AI_URL = 'http://10.73.135.29/v1';
process.env.LOCAL_AI_MODEL = '/home/aidata/h100/gpt-oss-120b/';
process.env.LOCAL_AI_MAX_TOKENS = '1000';
process.env.LOCAL_AI_TEMPERATURE = '0.7';

console.log('🔧 Setting Local AI Configuration:');
console.log(`Provider: ${process.env.AI_PROVIDER}`);
console.log(`URL: ${process.env.LOCAL_AI_URL}`);
console.log(`Model: ${process.env.LOCAL_AI_MODEL}`);
console.log(`Max Tokens: ${process.env.LOCAL_AI_MAX_TOKENS}`);
console.log(`Temperature: ${process.env.LOCAL_AI_TEMPERATURE}`);

// Test the configuration
import { getAIConfig } from './server/config/ai.js';

const config = getAIConfig();
console.log('\n📋 Final Configuration:');
console.log(`Provider: ${config.provider}`);
console.log(`Base URL: ${config.baseURL}`);
console.log(`Model: ${config.model}`);
console.log(`API Key: ${config.apiKey || 'None'}`);
