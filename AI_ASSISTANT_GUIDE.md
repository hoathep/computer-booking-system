# 🤖 Hướng dẫn AI Assistant - Computer Booking System

## 📋 Tổng quan

AI Assistant đã được tích hợp vào Computer Booking System để trả lời các câu hỏi về phần mềm. Trợ lý AI có thể:

- Hướng dẫn sử dụng hệ thống
- Giải thích các tính năng
- Hỗ trợ khắc phục sự cố
- Trả lời câu hỏi về cài đặt
- Chỉ trả lời câu hỏi liên quan đến Computer Booking System

### 🎯 **Hai loại AI Assistant:**

1. **User AI Assistant**: Dành cho người dùng thường
   - Hướng dẫn đặt máy, hủy booking
   - Giải thích tính năng user
   - Hỗ trợ khắc phục sự cố cơ bản

2. **Admin AI Assistant**: Dành cho quản trị viên
   - Quản lý users và groups
   - Cấu hình hệ thống
   - Xuất báo cáo và thống kê
   - Khắc phục sự cố admin
   - Hướng dẫn cài đặt nâng cao

## 🔧 Cấu hình AI Providers

AI Assistant hỗ trợ 2 loại AI providers:

- **OpenAI** (GPT-3.5, GPT-4) - AI trên mạng
- **Local AI** (vLLM, Ollama) - AI local

### 1. Tạo file .env

```bash
cd server
cp env.example .env
```

### 2. Chỉnh sửa file .env

## 🌐 **Cấu hình OpenAI (AI trên mạng)**

```env
# Chọn OpenAI
AI_PROVIDER=openai

# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_MAX_TOKENS=1000
OPENAI_TEMPERATURE=0.7
```

**Lấy OpenAI API Key:**
1. Truy cập: https://platform.openai.com/api-keys
2. Đăng nhập hoặc tạo tài khoản
3. Tạo API key mới
4. Copy API key vào `OPENAI_API_KEY`

## 🏠 **Cấu hình Local AI (vLLM)**

```env
# Chọn Local AI
AI_PROVIDER=localai

# Local AI Configuration
LOCAL_AI_URL=http://10.73.135.39:8000/v1
LOCAL_AI_API_KEY=your_local_ai_key_here
LOCAL_AI_MODEL=llama2
LOCAL_AI_MAX_TOKENS=1000
LOCAL_AI_TEMPERATURE=0.7
```

**Cấu hình vLLM:**
1. Đảm bảo vLLM server đang chạy tại `http://10.73.135.39:8000`
2. Kiểm tra model có sẵn
3. Cấu hình `LOCAL_AI_URL` và `LOCAL_AI_MODEL`

## 🚀 Cách sử dụng AI Assistant

### 1. Truy cập AI Assistant

**User Interface:**
- Click vào floating AI button (màu xanh) ở góc phải dưới màn hình
- Hoặc click vào preview bubble

**Admin Interface:**
- Click vào floating AI button (màu đỏ) ở góc phải dưới màn hình
- Có icon Shield để phân biệt với User AI

### 2. Đặt câu hỏi

**User Questions:**
- "Làm thế nào để đặt máy?"
- "Cách hủy booking?"
- "Tính năng user có gì?"
- "Hướng dẫn cài đặt hệ thống"
- "Khắc phục lỗi kết nối"

**Admin Questions:**
- "Cách quản lý users?"
- "Hướng dẫn cấu hình email?"
- "Cách xuất báo cáo?"
- "Quản lý nhóm người dùng?"
- "Khắc phục sự cố admin?"

### 3. Tính năng

- **Giao diện chat hiện đại**: Thiết kế đẹp với gradient và animations
- **Đa ngôn ngữ**: Hỗ trợ Tiếng Việt, English, 日本語
- **Câu hỏi gợi ý**: Click để đặt câu hỏi nhanh
- **Real-time**: Phản hồi nhanh chóng
- **Context-aware**: Hiểu ngữ cảnh về Computer Booking System
- **Floating UI**: Floating button với animations đẹp mắt

## 🔄 Chuyển đổi AI Provider

### Cách 1: Thay đổi trong .env
```env
# Từ OpenAI sang Local AI
AI_PROVIDER=localai
LOCAL_AI_URL=http://10.73.135.39:8000/v1
LOCAL_AI_MODEL=llama2
```

### Cách 2: Runtime switching
```javascript
// Trong code
process.env.AI_PROVIDER = 'localai';
```

## 🔍 Troubleshooting

### Lỗi: "AI API Key not configured"

**Nguyên nhân:** Không có API key hoặc cấu hình sai

**Giải pháp:**
1. Kiểm tra file `.env`
2. Đảm bảo API key đúng
3. Restart server: `npm run server`

### Lỗi: "Connection refused" (Local AI)

**Nguyên nhân:** vLLM server không chạy

**Giải pháp:**
1. Kiểm tra vLLM server: `http://10.73.135.39:8000`
2. Đảm bảo model đã load
3. Kiểm tra network connection

### Lỗi: "Model not found"

**Nguyên nhân:** Model không tồn tại

**Giải pháp:**
1. Kiểm tra model có sẵn trên server
2. Sử dụng model đúng tên
3. Load model trước khi sử dụng

### Lỗi: "Failed to process AI request"

**Nguyên nhân:**
- Không có API key
- API key không hợp lệ
- Kết nối mạng không ổn định

**Giải pháp:**
1. Kiểm tra OPENAI_API_KEY trong .env
2. Kiểm tra kết nối mạng
3. Thử lại sau vài phút

### Lỗi: "Unauthorized"

**Nguyên nhân:**
- Chưa đăng nhập
- Token hết hạn

**Giải pháp:**
1. Đăng nhập lại
2. Refresh trang

### AI không trả lời câu hỏi

**Nguyên nhân:**
- Câu hỏi không liên quan đến hệ thống
- Từ khóa không được nhận diện

**Giải pháp:**
1. Đặt câu hỏi cụ thể về Computer Booking System
2. Sử dụng từ khóa: "đặt máy", "booking", "admin", "user", "cài đặt"

## 📊 So sánh AI Providers

| Provider | Cost | Speed | Quality | Privacy |
|----------|------|-------|---------|---------|
| OpenAI | $$$ | Fast | High | Cloud |
| Local AI | Free | Medium | Medium | Local |

## 🎯 Khuyến nghị

### **Development:**
- **Local AI** (vLLM) - Miễn phí, riêng tư

### **Production:**
- **OpenAI** - Chất lượng cao, ổn định

### **Budget:**
- **Local AI** - Miễn phí hoàn toàn

## 🔧 Advanced Configuration

### Custom Models
```env
# Sử dụng model tùy chỉnh
OPENAI_MODEL=gpt-4-turbo
LOCAL_AI_MODEL=custom-model-name
```

### Custom Endpoints
```env
# Sử dụng proxy hoặc custom endpoint
OPENAI_BASE_URL=https://your-proxy.com/v1
LOCAL_AI_URL=http://your-server:8080/v1
```

### Performance Tuning
```env
# Tối ưu hiệu suất
OPENAI_MAX_TOKENS=500
OPENAI_TEMPERATURE=0.3
LOCAL_AI_MAX_TOKENS=2000
```

## 📝 Logs và Debugging

### Enable Debug Mode
```env
NODE_ENV=development
DEBUG=ai:*
```

### Check AI Status
```bash
# Kiểm tra cấu hình
curl http://localhost:3000/api/ai/status

# Test AI response
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello AI"}'
```

## 🚀 Production Deployment

### Environment Variables
```bash
# Production .env
NODE_ENV=production
AI_PROVIDER=openai
OPENAI_API_KEY=sk-prod-key-here
OPENAI_MODEL=gpt-4
```

### Health Checks
```javascript
// Health check endpoint
app.get('/api/ai/health', async (req, res) => {
  try {
    const response = await aiService.generateResponse('test', 'test');
    res.json({ status: 'healthy', ai: 'working' });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', error: error.message });
  }
});
```

## 📚 Cấu trúc Knowledge Base

AI Assistant được cung cấp thông tin từ:

- `README.md` - Tổng quan hệ thống
- `USER_GUIDE.md` - Hướng dẫn sử dụng
- `FEATURES.md` - Danh sách tính năng
- `INSTALL.md` - Hướng dẫn cài đặt
- `PROJECT_STATUS.md` - Trạng thái dự án

## 🔐 Bảo mật

- **Authentication required**: Cần đăng nhập để sử dụng
- **Context filtering**: Chỉ trả lời câu hỏi liên quan đến hệ thống
- **Rate limiting**: Giới hạn số lượng request (có thể thêm)
- **Input validation**: Kiểm tra input trước khi gửi đến AI

## 🎨 Tùy chỉnh

### Thêm câu hỏi gợi ý

Chỉnh sửa file `client/src/i18n/locales/vi.json`:

```json
"ai": {
  "suggestions": {
    "newQuestion": "Câu hỏi mới của bạn"
  }
}
```

### Thêm thông tin vào Knowledge Base

Chỉnh sửa file `server/routes/ai.js`:

```javascript
const knowledgeBase = {
  // Thêm thông tin mới
  newFeature: "Thông tin tính năng mới"
};
```

## 📋 API Endpoints

### POST /api/ai/chat

Gửi câu hỏi đến AI Assistant:

```javascript
const response = await fetch('/api/ai/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    message: "Làm thế nào để đặt máy?",
    context: "computer-booking-system"
  })
});

const data = await response.json();
console.log(data.response); // Câu trả lời từ AI
```

## 🎉 Kết luận

AI Assistant đã được tích hợp hoàn chỉnh vào Computer Booking System với:

✅ **Giao diện chat hiện đại**  
✅ **Multi-provider support** (OpenAI + Local AI)  
✅ **Knowledge base đầy đủ**  
✅ **Đa ngôn ngữ**  
✅ **Bảo mật và validation**  
✅ **Fallback responses**  
✅ **Floating UI với animations**  
✅ **Context-aware responses**  

Người dùng có thể sử dụng AI Assistant để được hỗ trợ 24/7 về Computer Booking System!

---

**Chúc bạn cấu hình thành công! 🎉**
