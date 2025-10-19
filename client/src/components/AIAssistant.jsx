import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, X, HelpCircle } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const AIAssistant = ({ isOpen, onClose, isAdmin = false }) => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: isAdmin ? 
        `Xin chào Admin! Tôi là trợ lý AI chuyên về quản trị Computer Booking System. Tôi có thể giúp bạn:\n\n• Quản lý users và groups\n• Cấu hình hệ thống\n• Xuất báo cáo và thống kê\n• Khắc phục sự cố admin\n• Hướng dẫn cài đặt nâng cao\n\nBạn cần hỗ trợ gì về quản trị hệ thống?` :
        t('ai.welcome'),
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Load suggested questions from API
  useEffect(() => {
    const loadSuggestedQuestions = async () => {
      try {
        console.log('🔄 Loading suggested questions...');
        const response = await fetch(`/api/ai/suggestions?isAdmin=${isAdmin}`);
        console.log('Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('API data:', data);
          const questions = data.questions || [];
          console.log('Questions to set:', questions);
          setSuggestedQuestions(questions);
        } else {
          console.log('API failed, using fallback');
          throw new Error(`API failed with status ${response.status}`);
        }
      } catch (error) {
        console.error('Failed to load suggested questions:', error);
        // Fallback to default questions
        const fallbackQuestions = isAdmin ? [
          "Cách quản lý users?",
          "Hướng dẫn cấu hình email?",
          "Cách xuất báo cáo?",
          "Quản lý nhóm người dùng?",
          "Khắc phục sự cố admin?"
        ] : [
          t('ai.suggestions.howToBook'),
          t('ai.suggestions.howToCancel'),
          t('ai.suggestions.adminFeatures'),
          t('ai.suggestions.installation'),
          t('ai.suggestions.troubleshooting')
        ];
        console.log('Using fallback questions:', fallbackQuestions);
        setSuggestedQuestions(fallbackQuestions);
      }
    };

    if (isOpen) {
      loadSuggestedQuestions();
    }
  }, [isOpen, isAdmin, t]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Create bot message placeholder for streaming
    const botMessageId = Date.now() + 1;
    const botMessage = {
      id: botMessageId,
      type: 'bot',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    };

    setMessages(prev => [...prev, botMessage]);

    try {
      const response = await fetch('/api/ai/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          message: inputMessage,
          context: isAdmin ? 'computer-booking-system-admin' : 'computer-booking-system'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

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
              // Mark streaming as complete
              setMessages(prev => prev.map(msg => 
                msg.id === botMessageId 
                  ? { ...msg, isStreaming: false }
                  : msg
              ));
              break;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                // Update the streaming message
                setMessages(prev => prev.map(msg => 
                  msg.id === botMessageId 
                    ? { ...msg, content: msg.content + parsed.content }
                    : msg
                ));
              }
              if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch (e) {
              // Ignore parsing errors for incomplete chunks
            }
          }
        }
      }
    } catch (error) {
      console.error('AI Assistant Error:', error);
      // Update the streaming message with error
      setMessages(prev => prev.map(msg => 
        msg.id === botMessageId 
          ? { 
              ...msg, 
              content: t('ai.error'),
              isStreaming: false
            }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // suggestedQuestions is now loaded from API in useEffect

  const handleSuggestionClick = (suggestion) => {
    setInputMessage(suggestion);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t('ai.title')}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('ai.subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`flex items-start space-x-3 max-w-[80%] ${
                  message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}
                >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    message.type === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                  }`}
                >
                  {message.type === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>
                <div
                  className={`rounded-2xl px-4 py-3 ${
                    message.type === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}
                >
                  <div className="text-sm prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        // Custom styling for markdown elements
                        h1: ({children}) => <h1 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{children}</h1>,
                        h2: ({children}) => <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-2">{children}</h2>,
                        h3: ({children}) => <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{children}</h3>,
                        p: ({children}) => <p className="mb-2 text-gray-700 dark:text-gray-300">{children}</p>,
                        ul: ({children}) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                        ol: ({children}) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                        li: ({children}) => <li className="text-gray-700 dark:text-gray-300">{children}</li>,
                        table: ({children}) => <div className="overflow-x-auto mb-2"><table className="min-w-full border border-gray-300 dark:border-gray-600">{children}</table></div>,
                        thead: ({children}) => <thead className="bg-gray-50 dark:bg-gray-700">{children}</thead>,
                        tbody: ({children}) => <tbody className="bg-white dark:bg-gray-800">{children}</tbody>,
                        tr: ({children}) => <tr className="border-b border-gray-200 dark:border-gray-600">{children}</tr>,
                        th: ({children}) => <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{children}</th>,
                        td: ({children}) => <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">{children}</td>,
                        code: ({children}) => <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                        pre: ({children}) => <pre className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-xs overflow-x-auto">{children}</pre>,
                        blockquote: ({children}) => <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 dark:text-gray-400">{children}</blockquote>,
                        strong: ({children}) => <strong className="font-semibold text-gray-900 dark:text-white">{children}</strong>,
                        em: ({children}) => <em className="italic text-gray-600 dark:text-gray-400">{children}</em>,
                        hr: () => <hr className="my-3 border-gray-300 dark:border-gray-600" />,
                        a: ({href, children}) => <a href={href} className="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                    {message.isStreaming && (
                      <span className="inline-block w-2 h-4 bg-blue-500 ml-1 animate-pulse"></span>
                    )}
                  </div>
                  <p className="text-xs mt-1 opacity-70">
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && !messages.some(msg => msg.isStreaming) && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {t('ai.thinking')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions */}
        {messages.length === 1 && (
          <div className="px-6 pb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {t('ai.suggestedQuestions')}:
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(question)}
                  className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-end space-x-3">
            <div className="flex-1">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t('ai.placeholder')}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                rows="1"
                style={{ minHeight: '48px', maxHeight: '120px' }}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
