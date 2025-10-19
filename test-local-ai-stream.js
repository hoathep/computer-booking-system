#!/usr/bin/env node

console.log('🔍 Testing Local AI Streaming Format\n');

async function testLocalAIStream() {
  const baseURL = 'http://10.73.135.29:8000/v1';
  const model = '/home/aidata/h100/gpt-oss-120b/';
  
  console.log(`🌐 Testing: ${baseURL}`);
  console.log(`🤖 Model: ${model}`);
  
  try {
    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Hello, how are you?' }
        ],
        max_tokens: 100,
        temperature: 0.7,
        stream: true
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
            console.log('✅ Streaming completed');
            return;
          }
          try {
            const parsed = JSON.parse(data);
            console.log('📦 Parsed data:');
            console.log(JSON.stringify(parsed, null, 2));
            console.log('─'.repeat(30));
            
            // Check different possible content paths
            const content1 = parsed.choices?.[0]?.delta?.content;
            const content2 = parsed.choices?.[0]?.message?.content;
            const content3 = parsed.content;
            
            console.log(`Content paths:`);
            console.log(`  choices[0].delta.content: ${content1}`);
            console.log(`  choices[0].message.content: ${content2}`);
            console.log(`  content: ${content3}`);
            console.log('─'.repeat(30));
            
          } catch (e) {
            console.log(`❌ Parse error: ${e.message}`);
            console.log(`Raw data: ${data}`);
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Connection Error:', error.message);
  }
}

testLocalAIStream();
