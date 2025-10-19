#!/usr/bin/env node

import { AIService } from './server/services/aiService.js';

console.log('🔍 Testing Local AI Stream Direct\n');

const aiService = new AIService();

async function testLocalAIStream() {
  const message = "Tôi quên mật khẩu thì làm thế nào?";
  const systemPrompt = `Bạn là trợ lý AI thân thiện của **Computer Booking System** - hệ thống quản lý đặt máy tính trực tuyến.

🎯 **MỤC TIÊU CHÍNH:**
Giúp người dùng sử dụng hệ thống đặt máy tính một cách dễ dàng và hiệu quả.

**CÂU HỎI CỦA NGƯỜI DÙNG:** ${message}

Hãy trả lời dựa trên thông tin trên, tập trung vào hướng dẫn thực tế và dễ hiểu. Không sử dụng thuật ngữ kỹ thuật.`;

  console.log(`📤 Testing: "${message}"`);
  console.log('─'.repeat(50));
  
  try {
    await aiService.generateStreamResponse(message, systemPrompt, (chunk) => {
      process.stdout.write(chunk);
    });
    console.log('\n─'.repeat(50));
    console.log('✅ Streaming completed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testLocalAIStream();
