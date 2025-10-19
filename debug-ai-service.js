#!/usr/bin/env node

import { AIService } from './server/services/aiService.js';

console.log('🔍 Debug AI Service\n');

const aiService = new AIService();

console.log('📋 AI Service Config:');
console.log(`Provider: ${aiService.config.provider}`);
console.log(`BaseURL: ${aiService.config.baseURL}`);
console.log(`Model: ${aiService.config.model}`);
console.log(`isValid: ${aiService.isValid}`);

console.log('\n🧪 Testing AI Service directly...');

const testMessage = "Tôi quên mật khẩu thì làm thế nào?";
const testPrompt = `Bạn là trợ lý AI thân thiện của **Computer Booking System** - hệ thống quản lý đặt máy tính trực tuyến.

🎯 **MỤC TIÊU CHÍNH:**
Giúp người dùng sử dụng hệ thống đặt máy tính một cách dễ dàng và hiệu quả.

**CÂU HỎI CỦA NGƯỜI DÙNG:** ${testMessage}

Hãy trả lời dựa trên thông tin trên, tập trung vào hướng dẫn thực tế và dễ hiểu. Không sử dụng thuật ngữ kỹ thuật.`;

async function testAIService() {
  try {
    console.log(`\n📤 Testing: "${testMessage}"`);
    console.log('─'.repeat(50));
    
    const response = await aiService.generateResponse(testMessage, testPrompt);
    
    console.log('📥 AI Response:');
    console.log('─'.repeat(50));
    console.log(response);
    console.log('─'.repeat(50));
    
    const isFallback = response.includes('Tôi chỉ có thể trả lời các câu hỏi liên quan đến hệ thống đặt máy tính này');
    console.log(`\n🎯 Result: ${isFallback ? '❌ FALLBACK' : '✅ REAL AI'}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAIService();
