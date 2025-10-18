import express from 'express';
import fs from 'fs';
import path from 'path';
import { aiService } from '../services/aiService.js';

const router = express.Router();

// Knowledge base từ các file markdown
const knowledgeBase = {
  system: `Bạn là trợ lý AI chuyên về Computer Booking System - một hệ thống quản lý đặt máy tính trực tuyến.

THÔNG TIN HỆ THỐNG:
- Phiên bản: Beta 0.2
- Trạng thái: Development & Testing
- Ngôn ngữ hỗ trợ: Tiếng Việt, English, 日本語

TÍNH NĂNG CHÍNH:
1. Đăng ký và đăng nhập tài khoản
2. Đặt lịch sử dụng máy với thời gian tùy chọn
3. Quản lý booking (xem, hủy)
4. Đánh giá máy tính sau khi sử dụng (1-5 sao)
5. Hỗ trợ đa ngôn ngữ
6. Admin panel đầy đủ
7. Client app tự động mở/khóa máy

KIẾN TRÚC:
- Backend: Node.js + Express + SQLite
- Frontend: React + Tailwind CSS
- Client App: Node.js desktop app

QUY TẮC TRẢ LỜI:
- Chỉ trả lời câu hỏi liên quan đến Computer Booking System
- Nếu câu hỏi không liên quan đến phần mềm, từ chối trả lời
- Sử dụng ngôn ngữ thân thiện, dễ hiểu
- Cung cấp hướng dẫn cụ thể khi có thể
- Nếu không biết, hãy thừa nhận và đề xuất liên hệ admin`,

  features: {
    user: [
      "Đăng ký và đăng nhập tài khoản",
      "Xem danh sách máy tính có sẵn", 
      "Đặt lịch sử dụng máy với thời gian tùy chọn",
      "Xem lịch sử và trạng thái booking",
      "Hủy booking (trước khi bắt đầu)",
      "Giới hạn số máy có thể đặt cùng lúc",
      "Đánh giá máy tính sau khi sử dụng (1-5 sao)",
      "Xem máy 'hot' (được đặt nhiều nhất)",
      "Nhận mật khẩu đăng nhập qua email",
      "Hỗ trợ đa ngôn ngữ (Tiếng Việt, English, 日本語)"
    ],
    admin: [
      "Quản lý người dùng (thêm, sửa, xóa)",
      "Quản lý máy tính (thêm, sửa, xóa, cập nhật trạng thái)",
      "Quản lý booking (xem tất cả, xóa)",
      "Quản lý nhóm người dùng và giới hạn booking",
      "Dashboard thống kê tổng quan",
      "Đặt giới hạn booking theo nhóm hoặc từng user",
      "Báo cáo tổng hợp với biểu đồ thời gian",
      "Xuất báo cáo ra file Excel",
      "Quản lý cài đặt email SMTP",
      "Quản lý cài đặt footer hệ thống",
      "Import/Export danh sách nhóm",
      "Quản lý đa ngôn ngữ"
    ]
  },

  installation: {
    requirements: "Node.js >= 18.0.0, npm >= 9.0.0",
    steps: [
      "Clone repository",
      "Cài đặt backend: npm install",
      "Cài đặt frontend: cd client && npm install",
      "Cài đặt client app: cd client-app && npm install",
      "Cấu hình .env files",
      "Chạy: npm run dev"
    ],
    defaultAccount: {
      admin: "Username: admin, Password: admin123"
    }
  },

  api: {
    auth: [
      "POST /api/auth/login - Đăng nhập",
      "POST /api/auth/register - Đăng ký", 
      "GET /api/auth/me - Lấy thông tin user hiện tại"
    ],
    computers: [
      "GET /api/computers - Lấy danh sách máy",
      "GET /api/computers/:id - Lấy thông tin 1 máy",
      "GET /api/computers/:id/bookings - Lấy bookings của máy"
    ],
    bookings: [
      "GET /api/bookings/my-bookings - Lấy bookings của user",
      "GET /api/bookings/active - Lấy bookings đang hoạt động", 
      "POST /api/bookings - Tạo booking mới",
      "DELETE /api/bookings/:id - Hủy booking"
    ]
  }
};

// Hàm kiểm tra câu hỏi có liên quan đến hệ thống không
function isRelevantQuestion(message, isAdmin = false) {
  const userKeywords = [
    'computer booking', 'đặt máy', 'booking system', 'hệ thống đặt máy',
    'user', 'máy tính', 'computer', 'lịch', 'schedule',
    'đăng nhập', 'login', 'đăng ký', 'register', 'tài khoản', 'account',
    'cài đặt', 'installation', 'hướng dẫn', 'guide', 'troubleshoot',
    'lỗi', 'error', 'bug', 'fix', 'sửa', 'khắc phục'
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
  return keywords.some(keyword => messageLower.includes(keyword));
}

// Hàm tạo prompt cho AI
function createPrompt(userMessage) {
  return `${knowledgeBase.system}

THÔNG TIN CHI TIẾT:

TÍNH NĂNG USER:
${knowledgeBase.features.user.map(f => `- ${f}`).join('\n')}

TÍNH NĂNG ADMIN:
${knowledgeBase.features.admin.map(f => `- ${f}`).join('\n')}

HƯỚNG DẪN CÀI ĐẶT:
Yêu cầu hệ thống: ${knowledgeBase.installation.requirements}
Các bước:
${knowledgeBase.installation.steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

Tài khoản mặc định: ${knowledgeBase.installation.defaultAccount.admin}

API ENDPOINTS:
${Object.entries(knowledgeBase.api).map(([category, endpoints]) => 
  `${category.toUpperCase()}:\n${endpoints.map(e => `- ${e}`).join('\n')}`
).join('\n\n')}

CÂU HỎI CỦA NGƯỜI DÙNG: ${userMessage}

Hãy trả lời câu hỏi một cách chi tiết và hữu ích. Nếu câu hỏi không liên quan đến Computer Booking System, hãy từ chối trả lời và đề xuất người dùng hỏi về hệ thống.`;
}

// POST /api/ai/chat
router.post('/chat', async (req, res) => {
  try {
    const { message, context } = req.body;
    const isAdmin = context === 'computer-booking-system-admin';

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Kiểm tra câu hỏi có liên quan không
    if (!isRelevantQuestion(message, isAdmin)) {
      const adminMessage = isAdmin ? 
        `Xin chào Admin! Tôi là trợ lý AI chuyên về quản trị Computer Booking System. Tôi chỉ có thể trả lời các câu hỏi liên quan đến quản trị hệ thống.

Vui lòng hỏi về:
- Quản lý users và groups
- Cấu hình hệ thống
- Xuất báo cáo và thống kê
- Khắc phục sự cố admin
- Hướng dẫn cài đặt nâng cao
- API endpoints và deployment

Bạn cần hỗ trợ gì về quản trị hệ thống?` :
        `Xin chào! Tôi là trợ lý AI chuyên về Computer Booking System. Tôi chỉ có thể trả lời các câu hỏi liên quan đến hệ thống đặt máy tính này.

Vui lòng hỏi về:
- Cách sử dụng hệ thống
- Tính năng của phần mềm  
- Hướng dẫn cài đặt
- Quản lý admin
- API endpoints
- Khắc phục sự cố

Bạn có câu hỏi gì về Computer Booking System không?`;

      return res.json({
        response: adminMessage
      });
    }

    // Tạo prompt
    const prompt = createPrompt(message);

    // Gọi AI Service
    const aiResponse = await aiService.generateResponse(message, prompt);

    res.json({
      response: aiResponse
    });

  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({
      error: 'Failed to process AI request',
      response: 'Xin lỗi, có lỗi xảy ra khi xử lý câu hỏi của bạn. Vui lòng thử lại sau.'
    });
  }
});

export default router;
