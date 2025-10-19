#!/usr/bin/env node

// Test logic isRelevantQuestion
function isRelevantQuestion(message, isAdmin = false) {
  const userKeywords = [
    'computer booking', 'đặt máy', 'booking system', 'hệ thống đặt máy',
    'user', 'máy tính', 'computer', 'lịch', 'schedule',
    'đăng nhập', 'login', 'đăng ký', 'register', 'tài khoản', 'account',
    'cài đặt', 'installation', 'hướng dẫn', 'guide', 'troubleshoot',
    'lỗi', 'error', 'bug', 'fix', 'sửa', 'khắc phục',
    'đặt', 'hủy', 'quản lý', 'đánh giá', 'mật khẩu', 'password',
    'rảnh', 'trống', 'bận', 'sử dụng', 'dùng', 'thời gian',
    'bao nhiêu', 'khi nào', 'làm sao', 'cách', 'thế nào',
    'quên', 'forgot', 'reset', 'đổi', 'change', 'thay đổi',
    'admin', 'quản trị', 'management', 'báo cáo', 'reports',
    'thống kê', 'statistics', 'người dùng', 'users'
  ];

  const adminKeywords = [
    ...userKeywords,
    'admin', 'quản trị', 'management', 'users', 'groups', 'computers',
    'báo cáo', 'reports', 'thống kê', 'statistics', 'email', 'smtp',
    'cấu hình', 'configuration', 'settings', 'api', 'endpoint', 
    'database', 'sqlite', 'react', 'nodejs', 'deployment', 'production'
  ];
  
  const keywords = isAdmin ? adminKeywords : userKeywords;
  const messageLower = message.toLowerCase();
  
  console.log(`Message: "${message}"`);
  console.log(`Lowercase: "${messageLower}"`);
  console.log(`Keywords to check:`, keywords.slice(0, 10), '...');
  
  const matches = keywords.filter(keyword => messageLower.includes(keyword));
  console.log(`Matches found:`, matches);
  
  return matches.length > 0;
}

const testMessages = [
  "Tôi quên mật khẩu thì làm thế nào?",
  "Có thể đặt bao nhiêu máy cùng lúc?",
  "Làm sao biết máy nào đang rảnh?",
  "Làm sao đánh giá máy sau khi dùng?",
  "Tôi là admin, làm sao quản lý người dùng?",
  "Làm sao xem báo cáo thống kê?"
];

console.log('🔍 Debug AI Logic\n');

testMessages.forEach((message, index) => {
  console.log(`\n${index + 1}. Testing: "${message}"`);
  console.log('─'.repeat(50));
  const isRelevant = isRelevantQuestion(message);
  console.log(`Result: ${isRelevant ? '✅ RELEVANT' : '❌ NOT RELEVANT'}`);
});
