import { getAIConfig, validateAIConfig } from '../config/ai.js';

// AI Service để xử lý các loại AI khác nhau
export class AIService {
  constructor() {
    this.config = getAIConfig();
    this.isValid = validateAIConfig();
  }

  // Gọi OpenAI API
  async callOpenAI(message, systemPrompt) {
    try {
      const response = await fetch(`${this.config.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw error;
    }
  }

  // Gọi Local AI (vLLM, Ollama, etc.)
  async callLocalAI(message, systemPrompt) {
    try {
      const headers = {
        'Content-Type': 'application/json'
      };

      // Thêm API key nếu có
      if (this.config.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      }

      const response = await fetch(`${this.config.baseURL}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature
        })
      });

      if (!response.ok) {
        throw new Error(`Local AI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Local AI API Error:', error);
      throw error;
    }
  }

  // Main method để gọi AI
  async generateResponse(message, systemPrompt) {
    if (!this.isValid && this.config.provider === 'openai') {
      return this.getFallbackResponse();
    }

    try {
      if (this.config.provider === 'localai') {
        return await this.callLocalAI(message, systemPrompt);
      } else {
        return await this.callOpenAI(message, systemPrompt);
      }
    } catch (error) {
      console.error('AI Service Error:', error);
      return this.getFallbackResponse();
    }
  }

  // Fallback response khi AI không khả dụng
  getFallbackResponse() {
    return `Xin chào! Tôi là trợ lý AI chuyên về Computer Booking System. Hiện tại tôi đang gặp sự cố kỹ thuật.

Tuy nhiên, tôi có thể cung cấp thông tin cơ bản về hệ thống:

🎯 **TÍNH NĂNG CHÍNH:**
• Đặt lịch sử dụng máy tính
• Quản lý booking cá nhân  
• Đánh giá máy tính (1-5 sao)
• Hỗ trợ đa ngôn ngữ
• Admin panel đầy đủ

🔧 **CÀI ĐẶT:**
• Yêu cầu: Node.js >= 18.0.0
• Chạy: npm run dev
• Admin mặc định: admin/admin123

Bạn có thể liên hệ admin để được hỗ trợ chi tiết hơn.`;
  }
}

// Export singleton instance
export const aiService = new AIService();
