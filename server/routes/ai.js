import express from 'express';
import fs from 'fs';
import path from 'path';
import { aiService } from '../services/aiService.js';
import { db } from '../database/init.js';

const router = express.Router();

// Import user guide data

const userGuidePath = path.join(process.cwd(), 'server', 'data', 'user-guide.json');
const userGuide = JSON.parse(fs.readFileSync(userGuidePath, 'utf8'));

// Function to get content by language
const getContentByLanguage = (content, language = 'vi') => {
  if (typeof content === 'string') return content;
  if (typeof content === 'object' && content !== null) {
    return content[language] || content.vi || content.en || Object.values(content)[0];
  }
  return content;
};

// Function to detect language from user message
const detectLanguage = (message) => {
  const messageLower = message.toLowerCase();
  
  // Japanese detection
  if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(message) || 
      messageLower.includes('こんにちは') || messageLower.includes('ありがとう') ||
      messageLower.includes('すみません') || messageLower.includes('お願い')) {
    return 'ja';
  }
  
  // English detection
  if (messageLower.includes('hello') || messageLower.includes('hi') ||
      messageLower.includes('how') || messageLower.includes('what') ||
      messageLower.includes('when') || messageLower.includes('where') ||
      messageLower.includes('why') || messageLower.includes('can you') ||
      messageLower.includes('please') || messageLower.includes('thank you')) {
    return 'en';
  }
  
  // Default to Vietnamese
  return 'vi';
};

// Function to create system prompt based on language
const createSystemPrompt = (language = 'vi') => {
  const systemInfo = userGuide.systemInfo;
  const description = getContentByLanguage(systemInfo.description, language);
  
  const prompts = {
    vi: `Bạn là trợ lý AI thân thiện của **${systemInfo.name}** - ${description}.

🎯 **MỤC TIÊU CHÍNH:**
Giúp người dùng sử dụng hệ thống đặt máy tính một cách dễ dàng và hiệu quả.

📋 **THÔNG TIN HỆ THỐNG:**
- **Tên:** ${systemInfo.name}
- **Phiên bản:** ${systemInfo.version}
- **Mô tả:** ${description}
- **Ngôn ngữ:** ${systemInfo.languages.join(', ')}

👥 **ĐỐI TƯỢNG SỬ DỤNG:**
- **Người dùng thường:** Sinh viên, nhân viên, khách muốn đặt máy tính
- **Quản trị viên:** Quản lý hệ thống, người dùng, máy tính

🎨 **PHONG CÁCH TRẢ LỜI:**
- Thân thiện, dễ hiểu, không dùng thuật ngữ kỹ thuật
- Tập trung vào hướng dẫn thực tế, không nói về API hay code
- Sử dụng emoji và format đẹp để dễ đọc
- Đưa ra ví dụ cụ thể khi có thể
- Nếu không biết, đề xuất liên hệ admin

❌ **KHÔNG TRẢ LỜI:**
- Câu hỏi không liên quan đến hệ thống đặt máy
- Hướng dẫn kỹ thuật về code, API, database
- Thông tin về các hệ thống khác`,

    en: `You are a friendly AI assistant for **${systemInfo.name}** - ${description}.

🎯 **MAIN GOAL:**
Help users use the computer booking system easily and efficiently.

📋 **SYSTEM INFORMATION:**
- **Name:** ${systemInfo.name}
- **Version:** ${systemInfo.version}
- **Description:** ${description}
- **Languages:** ${systemInfo.languages.join(', ')}

👥 **TARGET USERS:**
- **Regular users:** Students, employees, guests who want to book computers
- **Administrators:** System, user, and computer management

🎨 **RESPONSE STYLE:**
- Friendly, easy to understand, no technical jargon
- Focus on practical guidance, don't talk about APIs or code
- Use emojis and beautiful formatting for easy reading
- Provide specific examples when possible
- If you don't know, suggest contacting admin

❌ **DO NOT ANSWER:**
- Questions unrelated to the computer booking system
- Technical guidance about code, APIs, databases
- Information about other systems`,

    ja: `あなたは**${systemInfo.name}**の親しみやすいAIアシスタントです - ${description}。

🎯 **主な目標:**
ユーザーがコンピューター予約システムを簡単かつ効率的に使用できるよう支援します。

📋 **システム情報:**
- **名前:** ${systemInfo.name}
- **バージョン:** ${systemInfo.version}
- **説明:** ${description}
- **言語:** ${systemInfo.languages.join(', ')}

👥 **対象ユーザー:**
- **一般ユーザー:** コンピューターを予約したい学生、従業員、ゲスト
- **管理者:** システム、ユーザー、コンピューターの管理

🎨 **回答スタイル:**
- 親しみやすく、理解しやすく、技術用語を使わない
- 実用的なガイダンスに焦点を当て、APIやコードについて話さない
- 読みやすくするために絵文字と美しいフォーマットを使用
- 可能な限り具体的な例を提供
- わからない場合は管理者に連絡することを提案

❌ **回答しない:**
- コンピューター予約システムに関係のない質問
- コード、API、データベースに関する技術的ガイダンス
- 他のシステムに関する情報`
  };
  
  return prompts[language] || prompts.vi;
};

// Knowledge base từ user guide
const knowledgeBase = {
  system: createSystemPrompt('vi'),

  userGuide: userGuide.userGuide,
  faq: userGuide.faq,

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
  
  // Luôn trả lời nếu có từ khóa liên quan
  return keywords.some(keyword => messageLower.includes(keyword));
}

// Hàm tạo prompt cho AI
function createPrompt(userMessage, isAdmin = false, language = 'vi') {
  const guide = knowledgeBase.userGuide;
  
  // Detect language from user message
  const detectedLanguage = detectLanguage(userMessage) || language;
  
  // Get system prompt for the detected language
  const systemPrompt = createSystemPrompt(detectedLanguage);
  
  // Get localized content
  const gettingStartedTitle = getContentByLanguage(guide.gettingStarted?.title, detectedLanguage);
  const gettingStartedSteps = guide.gettingStarted?.steps?.map(step => {
    const title = getContentByLanguage(step.title, detectedLanguage);
    const description = getContentByLanguage(step.description, detectedLanguage);
    const details = getContentByLanguage(step.details, detectedLanguage);
    return `${step.step}. **${title}**\n   ${description}\n   💡 ${details}`;
  }).join('\n\n') || getContentByLanguage('Không có hướng dẫn bắt đầu', detectedLanguage);
  
  // Get localized content for all sections
  const bookingProcessTitle = getContentByLanguage(guide.bookingProcess?.title, detectedLanguage);
  const bookingProcessSteps = guide.bookingProcess?.steps?.map(step => {
    const title = getContentByLanguage(step.title, detectedLanguage);
    const description = getContentByLanguage(step.description, detectedLanguage);
    const details = getContentByLanguage(step.details, detectedLanguage);
    return `${step.step}. **${title}**\n   ${description}\n   💡 ${details}`;
  }).join('\n\n') || getContentByLanguage('Không có hướng dẫn đặt máy', detectedLanguage);

  const managingBookingsTitle = getContentByLanguage(guide.managingBookings?.title, detectedLanguage);
  const managingBookingsFeatures = guide.managingBookings?.features?.map(feature => {
    const featureName = getContentByLanguage(feature.feature, detectedLanguage);
    const description = getContentByLanguage(feature.description, detectedLanguage);
    const details = getContentByLanguage(feature.details, detectedLanguage);
    return `• **${featureName}**: ${description}\n  💡 ${details}`;
  }).join('\n\n') || getContentByLanguage('Không có tính năng quản lý', detectedLanguage);

  const commonTasksTitle = getContentByLanguage(guide.commonTasks?.title, detectedLanguage);
  const commonTasksList = guide.commonTasks?.tasks?.map(task => {
    const taskName = getContentByLanguage(task.task, detectedLanguage);
    const solution = getContentByLanguage(task.solution, detectedLanguage);
    return `**${taskName}**: ${solution}`;
  }).join('\n\n') || getContentByLanguage('Không có tác vụ thường gặp', detectedLanguage);

  const tipsTitle = getContentByLanguage(guide.tipsAndTricks?.title, detectedLanguage);
  const tipsList = guide.tipsAndTricks?.tips?.map(tip => {
    const tipName = getContentByLanguage(tip.tip, detectedLanguage);
    const description = getContentByLanguage(tip.description, detectedLanguage);
    return `• **${tipName}**: ${description}`;
  }).join('\n') || getContentByLanguage('Không có mẹo sử dụng', detectedLanguage);

  const faqTitle = getContentByLanguage('Câu hỏi thường gặp', detectedLanguage);
  const faqList = guide.faq?.general?.map(qa => {
    const question = getContentByLanguage(qa.question, detectedLanguage);
    const answer = getContentByLanguage(qa.answer, detectedLanguage);
    return `**Q:** ${question}\n**A:** ${answer}`;
  }).join('\n\n') || getContentByLanguage('Không có câu hỏi thường gặp', detectedLanguage);

  const adminFeaturesTitle = getContentByLanguage(guide.adminFeatures?.title, detectedLanguage);
  const adminFeaturesList = guide.adminFeatures?.features?.map(feature => {
    const featureName = getContentByLanguage(feature.feature, detectedLanguage);
    const description = getContentByLanguage(feature.description, detectedLanguage);
    const details = getContentByLanguage(feature.details, detectedLanguage);
    return `• **${featureName}**: ${description}\n  💡 ${details}`;
  }).join('\n\n') || getContentByLanguage('Không có tính năng admin', detectedLanguage);

  const userQuestionLabel = getContentByLanguage('CÂU HỎI CỦA NGƯỜI DÙNG', detectedLanguage);
  const responseInstruction = getContentByLanguage('Hãy trả lời dựa trên thông tin trên, tập trung vào hướng dẫn thực tế và dễ hiểu. Không sử dụng thuật ngữ kỹ thuật.', detectedLanguage);

  return `${systemPrompt}

📚 **${getContentByLanguage('HƯỚNG DẪN SỬ DỤNG CHI TIẾT', detectedLanguage)}:**

## 🚀 ${gettingStartedTitle}
${gettingStartedSteps}

## 📅 ${bookingProcessTitle}
${bookingProcessSteps}

## 📋 ${managingBookingsTitle}
${managingBookingsFeatures}

## 🔧 ${commonTasksTitle}
${commonTasksList}

## 💡 ${tipsTitle}
${tipsList}

## ❓ ${faqTitle}
${faqList}

${isAdmin ? `
## 👨‍💼 ${adminFeaturesTitle}
${adminFeaturesList}
` : ''}

**${userQuestionLabel}:** ${userMessage}

${responseInstruction}`;
}

// POST /api/ai/chat
router.post('/chat', async (req, res) => {
  try {
    const { message, context } = req.body;
    const isAdmin = context && context.includes('admin');

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Luôn trả lời câu hỏi, AI sẽ tự động xử lý trong prompt
    // Comment out relevance check để AI luôn trả lời

    // Tạo prompt với language detection
    const prompt = createPrompt(message, isAdmin);

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

// POST /api/ai/chat/stream - Streaming endpoint
router.post('/chat/stream', async (req, res) => {
  try {
    const { message, context } = req.body;
    const isAdmin = context && context.includes('admin');

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Set headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

    // Luôn trả lời câu hỏi, AI sẽ tự động xử lý trong prompt
    // Comment out relevance check để AI luôn trả lời

    // Tạo prompt với language detection
    const prompt = createPrompt(message, isAdmin);

    // Gọi AI Service với streaming
    console.log('Calling generateStreamResponse...');
    await aiService.generateStreamResponse(message, prompt, (chunk) => {
      console.log('Received chunk:', chunk);
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    });
    console.log('generateStreamResponse completed');

    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error) {
    console.error('AI Streaming Error:', error);
    res.write(`data: ${JSON.stringify({ error: 'Failed to process AI request' })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

// Get suggested questions (public endpoint)
router.get('/suggestions', (req, res) => {
  try {
    const { isAdmin } = req.query;
    const adminMode = isAdmin === 'true';
    
    // Get questions from database
    const settings = db.prepare(`
      SELECT key, value FROM settings 
      WHERE key IN ('ai_adminQuestions', 'ai_userQuestions')
    `).all();
    
    const config = {};
    settings.forEach(setting => {
      const key = setting.key.replace('ai_', '');
      try {
        config[key] = JSON.parse(setting.value);
      } catch {
        config[key] = [];
      }
    });
    
    // Default questions if not found in database
    const defaultAdminQuestions = [
      "Cách quản lý users?",
      "Quản lý nhóm người dùng?",
      "Cách xuất báo cáo?",
      "Quản lý mẫu email?",
      "Khắc phục sự cố trợ lý AI?"
    ];    
    const defaultUserQuestions = [
      "Cách đặt lịch sử dụng máy tính?",
      "Làm sao hủy lịch đặt?",
      "Tính năng My Bookings có gì?",
      "Tính năng máy hot như thế nào?",
      "Tại sao tôi lại bị hạn chế số máy đặt?"
    ];
    
    const questions = adminMode 
      ? (config.adminQuestions || defaultAdminQuestions)
      : (config.userQuestions || defaultUserQuestions);
    
    res.json({ questions });
  } catch (error) {
    console.error('Error getting suggestions:', error);
    // Return default questions on error
    const defaultQuestions = req.query.isAdmin === 'true' ? [
      "Cách quản lý users?",
      "Quản lý nhóm người dùng?",
      "Cách xuất báo cáo?",
      "Quản lý mẫu email?",
      "Khắc phục sự cố trợ lý AI?"
    ] : [
      "Cách đặt lịch sử dụng máy tính?",
      "Làm sao hủy lịch đặt?",
      "Tính năng My Bookings có gì?",
      "Tính năng máy hot như thế nào?",
      "Tại sao tôi lại bị hạn chế số máy đặt?"
    ];
    res.json({ questions: defaultQuestions });
  }
});

export default router;
