#!/usr/bin/env node

console.log('🔍 Testing Local AI Connection\n');

async function testLocalAI() {
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
        temperature: 0.7
      })
    });

    console.log(`Status: ${response.status}`);
    console.log(`Headers:`, Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const text = await response.text();
      console.error(`❌ Error Response: ${text}`);
      return false;
    }

    const data = await response.json();
    console.log('✅ Success! Response:');
    console.log(JSON.stringify(data, null, 2));
    return true;

  } catch (error) {
    console.error('❌ Connection Error:', error.message);
    return false;
  }
}

testLocalAI().then(success => {
  console.log(`\n🎯 Result: ${success ? '✅ CONNECTED' : '❌ FAILED'}`);
});
