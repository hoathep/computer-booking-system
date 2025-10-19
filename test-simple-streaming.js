#!/usr/bin/env node

console.log('🧪 Testing AI Streaming - Simple Test\n');

const testMessage = 'Xin chào, bạn có thể giúp tôi gì về Computer Booking System?';

console.log(`📤 Sending message: "${testMessage}"`);
console.log('🌐 Testing endpoint: http://localhost:3000/api/ai/chat/stream');
console.log('\n📥 Streaming response:\n');

try {
  const response = await fetch('http://localhost:3000/api/ai/chat/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: testMessage,
      context: 'computer-booking-system'
    })
  });

  console.log(`Status: ${response.status}`);
  console.log(`Headers:`, Object.fromEntries(response.headers.entries()));

  if (!response.ok) {
    const text = await response.text();
    console.error(`❌ Error Response: ${text}`);
    process.exit(1);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  console.log('🤖 AI Response (streaming):');
  console.log('─'.repeat(50));

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') {
          console.log('\n─'.repeat(50));
          console.log('✅ Streaming completed');
          process.exit(0);
        }
        try {
          const parsed = JSON.parse(data);
          if (parsed.content) {
            process.stdout.write(parsed.content);
          }
          if (parsed.error) {
            console.error(`\n❌ Error: ${parsed.error}`);
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }
    }
  }
} catch (error) {
  console.error('❌ Connection Error:', error.message);
  console.log('\n💡 Make sure the server is running:');
  console.log('   npm run server');
}
