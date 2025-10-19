#!/usr/bin/env node

const ports = [80, 8000, 8080, 3000, 5000];
const baseUrl = 'http://10.73.135.29';

console.log('🔍 Testing different ports for AI server...\n');

for (const port of ports) {
  const url = `${baseUrl}:${port}/v1/models`;
  console.log(`Testing port ${port}: ${url}`);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      console.log(`✅ Port ${port} is working!`);
      const models = await response.json();
      console.log(`   Models available: ${models.data?.length || 0}`);
      if (models.data && models.data.length > 0) {
        console.log(`   First model: ${models.data[0].id}`);
      }
      console.log(`   ✅ Use this URL: ${baseUrl}:${port}/v1`);
      break;
    } else {
      console.log(`❌ Port ${port}: HTTP ${response.status}`);
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log(`⏰ Port ${port}: Timeout`);
    } else {
      console.log(`❌ Port ${port}: ${error.message}`);
    }
  }
  
  console.log('');
}
