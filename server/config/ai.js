// AI Assistant Configuration
export const aiConfig = {
  // AI Provider Configuration
  provider: process.env.AI_PROVIDER || 'openai', // openai, localai
  
  // OpenAI Configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 1000,
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7
  },

  // Local AI Configuration (vLLM, Ollama, etc.)
  localAI: {
    baseURL: process.env.LOCAL_AI_URL || 'http://localhost:8000/v1',
    apiKey: process.env.LOCAL_AI_API_KEY || null,
    model: process.env.LOCAL_AI_MODEL || 'llama2',
    maxTokens: parseInt(process.env.LOCAL_AI_MAX_TOKENS) || 1000,
    temperature: parseFloat(process.env.LOCAL_AI_TEMPERATURE) || 0.7
  },

  // Fallback Configuration
  fallback: {
    enabled: process.env.AI_FALLBACK_ENABLED !== 'false',
    message: process.env.AI_FALLBACK_MESSAGE || 'Xin lỗi, AI Assistant tạm thời không khả dụng. Vui lòng thử lại sau.'
  }
};

// Helper function to get AI configuration
export function getAIConfig() {
  const provider = aiConfig.provider;
  
  if (provider === 'localai') {
    return {
      ...aiConfig.localAI,
      provider: 'localai'
    };
  } else {
    return {
      ...aiConfig.openai,
      provider: 'openai'
    };
  }
}

// Validate AI configuration
export function validateAIConfig() {
  const config = getAIConfig();
  
  if (config.provider === 'openai' && !config.apiKey) {
    console.warn('⚠️  OpenAI API Key not configured. AI Assistant will use fallback responses.');
    return false;
  }
  
  if (config.provider === 'localai' && !config.baseURL) {
    console.warn('⚠️  Local AI URL not configured. Using default localhost:8000.');
  }
  
  console.log(`✅ AI Assistant configured with ${config.provider.toUpperCase()}`);
  console.log(`📍 AI Endpoint: ${config.baseURL}`);
  return true;
}
