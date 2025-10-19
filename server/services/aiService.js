import { getAIConfig, validateAIConfig } from '../config/ai.js';

// AI Service để xử lý các loại AI khác nhau
export class AIService {
  constructor() {
    this.config = getAIConfig();
    this.isValid = validateAIConfig();
    console.log('AIService constructor called');
    console.log('isValid:', this.isValid);
    console.log('provider:', this.config.provider);
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

  // Gọi Local AI với streaming
  async callLocalAIStream(message, systemPrompt, onChunk) {
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
          temperature: this.config.temperature,
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error(`Local AI API error: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              return;
            }
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                onChunk(content);
              }
            } catch (e) {
              console.log('Parse error in streaming:', e.message);
              console.log('Raw data:', data);
              // Ignore parsing errors for incomplete chunks
            }
          }
        }
      }
    } catch (error) {
      console.error('Local AI Streaming Error:', error);
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

  // Streaming method để gọi AI
  async generateStreamResponse(message, systemPrompt, onChunk) {
    console.log('generateStreamResponse called');
    console.log('isValid:', this.isValid);
    console.log('provider:', this.config.provider);
    
    if (!this.isValid) {
      console.log('Using fallback response due to !isValid');
      // Fallback response cũng có thể streaming
      const fallback = this.getFallbackResponse();
      const words = fallback.split(' ');
      for (let i = 0; i < words.length; i++) {
        onChunk(words[i] + (i < words.length - 1 ? ' ' : ''));
        await new Promise(resolve => setTimeout(resolve, 50)); // 50ms delay
      }
      return;
    }

    try {
      if (this.config.provider === 'localai') {
        console.log('Calling Local AI Stream...');
        await this.callLocalAIStream(message, systemPrompt, onChunk);
        console.log('Local AI Stream completed');
      } else {
        // OpenAI streaming (implement later if needed)
        const response = await this.callOpenAI(message, systemPrompt);
        const words = response.split(' ');
        for (let i = 0; i < words.length; i++) {
          onChunk(words[i] + (i < words.length - 1 ? ' ' : ''));
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
    } catch (error) {
      console.error('AI Streaming Service Error:', error);
      const fallback = this.getFallbackResponse();
      const words = fallback.split(' ');
      for (let i = 0; i < words.length; i++) {
        onChunk(words[i] + (i < words.length - 1 ? ' ' : ''));
        await new Promise(resolve => setTimeout(resolve, 50));
      }
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
