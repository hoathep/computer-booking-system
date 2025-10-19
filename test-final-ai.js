#!/usr/bin/env node

console.log('🎯 Final AI Test\n');

const testQuestions = [
  "Xin chào, bạn có thể giúp tôi gì?",
  "Làm sao để đặt máy tính?",
  "Tôi quên mật khẩu thì làm thế nào?",
  "Có thể đặt bao nhiêu máy cùng lúc?",
  "Làm sao biết máy nào đang rảnh?",
  "Có thể hủy lịch khi nào?",
  "Làm sao đánh giá máy sau khi dùng?",
  "Tôi là admin, làm sao quản lý người dùng?",
  "Làm sao xem báo cáo thống kê?"
];

async function testQuestion(question, index) {
  console.log(`\n${index + 1}. 📤 "${question}"`);
  console.log('─'.repeat(60));
  
  try {
    const response = await fetch('http://localhost:3000/api/ai/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: question,
        context: 'computer-booking-system'
      })
    });

    if (!response.ok) {
      console.error(`❌ HTTP Error: ${response.status}`);
      return false;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullResponse = '';

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
            console.log(`\n✅ Hoàn thành (${fullResponse.length} ký tự)`);
            
            // Check if it's a fallback response
            const isFallback = fullResponse.includes('Tôi chỉ có thể trả lời các câu hỏi liên quan đến hệ thống đặt máy tính này');
            console.log(`${isFallback ? '❌ FALLBACK' : '✅ GOOD'} Response`);
            return !isFallback;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              fullResponse += parsed.content;
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
    return false;
  }
}

async function runTests() {
  console.log('🚀 Testing AI Assistant với knowledge base mới\n');
  
  let successCount = 0;
  const totalQuestions = testQuestions.length;
  
  for (let i = 0; i < testQuestions.length; i++) {
    const success = await testQuestion(testQuestions[i], i);
    if (success) successCount++;
    
    if (i < testQuestions.length - 1) {
      console.log('\n' + '='.repeat(80));
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log(`\n🎉 Kết quả: ${successCount}/${totalQuestions} câu hỏi được trả lời tốt`);
  console.log(`📊 Tỷ lệ thành công: ${Math.round(successCount/totalQuestions*100)}%`);
}

runTests().catch(console.error);
