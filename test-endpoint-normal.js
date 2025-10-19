#!/usr/bin/env node

console.log('🔍 Testing Normal Endpoint\n');

async function testNormalEndpoint() {
  try {
    const response = await fetch('http://localhost:3000/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: "Tôi quên mật khẩu thì làm thế nào?",
        context: 'computer-booking-system'
      })
    });

    console.log(`Status: ${response.status}`);
    console.log(`Headers:`, Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const text = await response.text();
      console.error(`❌ Error Response: ${text}`);
      return;
    }

    const data = await response.json();
    console.log('📥 Response:');
    console.log('─'.repeat(50));
    console.log(data.response);
    console.log('─'.repeat(50));
    
    const isFallback = data.response.includes('Tôi chỉ có thể trả lời các câu hỏi liên quan đến hệ thống đặt máy tính này');
    console.log(`🎯 Result: ${isFallback ? '❌ FALLBACK' : '✅ REAL AI'}`);
    
  } catch (error) {
    console.error('❌ Connection Error:', error.message);
  }
}

testNormalEndpoint();
