import React, { useState, useEffect } from 'react';
import { Bot, MessageCircle, X, Sparkles, HelpCircle, Zap, Brain, Shield, Settings, BarChart } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import AIAssistant from './AIAssistant';

const AdminAIAssistant = () => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [pulseAnimation, setPulseAnimation] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [currentMood, setCurrentMood] = useState('admin'); // admin, thinking, excited

  // Hiệu ứng pulse khi có thông báo mới
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseAnimation(true);
      setTimeout(() => setPulseAnimation(false), 1000);
    }, 25000); // Pulse mỗi 25 giây

    return () => clearInterval(interval);
  }, []);

  // Hiệu ứng floating liên tục
  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(prev => !prev);
    }, 6000); // Float mỗi 6 giây

    return () => clearInterval(interval);
  }, []);

  // Hiệu ứng preview bubble
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPreview(true);
    }, 10000); // Hiện preview sau 10 giây

    return () => clearTimeout(timer);
  }, []);

  // Thay đổi mood theo thời gian
  useEffect(() => {
    const moods = ['admin', 'thinking', 'excited'];
    const interval = setInterval(() => {
      setCurrentMood(moods[Math.floor(Math.random() * moods.length)]);
    }, 15000); // Đổi mood mỗi 15 giây

    return () => clearInterval(interval);
  }, []);

  const handleClick = () => {
    setShowChat(true);
    setHasNewMessage(false);
    setShowPreview(false);
  };

  const handleClose = () => {
    setShowChat(false);
  };

  const getMoodIcon = () => {
    switch (currentMood) {
      case 'thinking':
        return <Brain className="w-8 h-8 text-white animate-pulse" />;
      case 'excited':
        return <Zap className="w-8 h-8 text-white animate-bounce" />;
      case 'admin':
        return <Shield className="w-8 h-8 text-white" />;
      default:
        return <Bot className="w-8 h-8 text-white" />;
    }
  };

  const getMoodColor = () => {
    switch (currentMood) {
      case 'thinking':
        return 'from-purple-500 to-indigo-600';
      case 'excited':
        return 'from-yellow-500 to-orange-600';
      case 'admin':
        return 'from-red-500 to-pink-600';
      default:
        return 'from-blue-500 to-purple-600';
    }
  };

  const getAdminSuggestions = () => {
    return [
      t('ai.suggestions.adminFeatures'),
      "Cách quản lý users?",
      "Hướng dẫn cấu hình email?",
      "Cách xuất báo cáo?",
      "Quản lý nhóm người dùng?"
    ];
  };

  return (
    <>
      {/* Floating AI Assistant Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* Notification Badge */}
        {hasNewMessage && (
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
            !
          </div>
        )}
        
        {/* Main Button */}
        <button
          onClick={handleClick}
          onMouseEnter={() => {
            setIsHovered(true);
            setShowPreview(false);
          }}
          onMouseLeave={() => setIsHovered(false)}
          className={`
            relative w-16 h-16 bg-gradient-to-r ${getMoodColor()}
            rounded-full shadow-2xl flex items-center justify-center
            transform transition-all duration-500 ease-in-out
            hover:scale-110 hover:shadow-3xl
            ${pulseAnimation ? 'animate-pulse-glow' : ''}
            ${isHovered ? 'scale-110' : 'scale-100'}
            ${isVisible ? 'animate-float' : ''}
            hover:animate-none
            group
          `}
          title={`${t('ai.title')} - Admin Mode`}
        >
          {/* Admin Icon với animation */}
          <div className="relative">
            {getMoodIcon()}
            
            {/* Sparkles effect khi hover */}
            {isHovered && (
              <>
                <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-yellow-300 animate-ping" />
                <Sparkles className="absolute -bottom-1 -left-1 w-2 h-2 text-yellow-300 animate-ping delay-150" />
                <Sparkles className="absolute top-0 -left-2 w-2 h-2 text-yellow-300 animate-ping delay-300" />
                <Sparkles className="absolute -bottom-2 -right-2 w-2 h-2 text-yellow-300 animate-ping delay-500" />
              </>
            )}
          </div>

          {/* Ripple effect */}
          <div className={`
            absolute inset-0 rounded-full bg-white opacity-20
            transform scale-0 transition-transform duration-300
            ${isHovered ? 'scale-150' : 'scale-0'}
          `} />

          {/* Admin indicator */}
          {currentMood === 'admin' && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-400 rounded-full animate-ping" />
          )}
        </button>

        {/* Tooltip */}
        {isHovered && (
          <div className="absolute bottom-20 right-0 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg whitespace-nowrap animate-fadeIn">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Admin AI Assistant</span>
            </div>
            {/* Arrow */}
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
          </div>
        )}

        {/* Chat bubble preview */}
        {!showChat && showPreview && !isHovered && (
          <div className="absolute bottom-20 right-0 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-4 max-w-xs animate-slideUp border border-gray-200 dark:border-gray-700">
            <div className="flex items-start space-x-3">
              <div className={`w-8 h-8 bg-gradient-to-r ${getMoodColor()} rounded-full flex items-center justify-center animate-pulse`}>
                {getMoodIcon()}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Admin AI Assistant
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {currentMood === 'thinking' 
                    ? 'Đang phân tích hệ thống...' 
                    : currentMood === 'excited'
                    ? 'Sẵn sàng hỗ trợ admin!'
                    : 'Hỗ trợ quản trị hệ thống'
                  }
                </p>
                <div className="flex space-x-2 mt-2">
                  <button
                    onClick={handleClick}
                    className="text-xs bg-red-500 text-white px-3 py-1 rounded-full hover:bg-red-600 transition-colors"
                  >
                    {t('ai.suggestions.adminFeatures')}
                  </button>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="text-xs bg-gray-200 text-gray-600 px-3 py-1 rounded-full hover:bg-gray-300 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
            {/* Arrow */}
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white dark:border-t-gray-800" />
          </div>
        )}

        {/* Admin thinking bubble */}
        {currentMood === 'thinking' && !isHovered && (
          <div className="absolute bottom-20 right-0 bg-purple-100 dark:bg-purple-900 rounded-2xl shadow-lg p-3 animate-slideUp">
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-200" />
              </div>
              <span className="text-xs text-purple-800 dark:text-purple-200">
                Phân tích dữ liệu admin...
              </span>
            </div>
            {/* Arrow */}
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-purple-100 dark:border-t-purple-900" />
          </div>
        )}
      </div>

      {/* AI Assistant Modal với Admin context */}
      <AIAssistant isOpen={showChat} onClose={handleClose} isAdmin={true} />
    </>
  );
};

export default AdminAIAssistant;
