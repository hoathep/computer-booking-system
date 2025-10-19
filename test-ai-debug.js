#!/usr/bin/env node

console.log('🔍 Debug AI Response\n');

async function testAI(message) {
  console.log(`📤 Message: "${message}"`);
  
  try {
    const response = await fetch('http://localhost:3000/api/ai/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
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

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullResponse = '';

    console.log('\n📥 Streaming response:');
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
            console.log(`✅ Completed (${fullResponse.length} chars)`);
            return;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              fullResponse += parsed.content;
              process.stdout.write(parsed.content);
            }
            if (parsed.error) {
              console.error(`\n❌ AI Error: ${parsed.error}`);
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Connection Error:', error.message);
  }
}

async function runTest() {
  await testAI("Tôi quên mật khẩu thì làm thế nào?");
  console.log('\n' + '='.repeat(80));
  await new Promise(resolve => setTimeout(resolve, 2000));
  await testAI("Làm sao để đặt máy tính?");
}

runTest().catch(console.error);
