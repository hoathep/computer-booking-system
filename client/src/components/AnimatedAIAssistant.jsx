import React, { useState, useEffect } from 'react';
import { Bot, MessageCircle, X, Sparkles, HelpCircle, Zap, Brain } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import AIAssistant from './AIAssistant';

const AnimatedAIAssistant = () => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [pulseAnimation, setPulseAnimation] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [currentMood, setCurrentMood] = useState('happy'); // happy, thinking, excited

  // Hiệu ứng pulse khi có thông báo mới
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseAnimation(true);
      setTimeout(() => setPulseAnimation(false), 1000);
    }, 20000); // Pulse mỗi 20 giây

    return () => clearInterval(interval);
  }, []);

  // Hiệu ứng floating liên tục
  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(prev => !prev);
    }, 5000); // Float mỗi 5 giây

    return () => clearInterval(interval);
  }, []);

  // Hiệu ứng preview bubble
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPreview(true);
    }, 8000); // Hiện preview sau 8 giây

    return () => clearTimeout(timer);
  }, []);

  // Thay đổi mood theo thời gian
  useEffect(() => {
    const moods = ['happy', 'thinking', 'excited'];
    const interval = setInterval(() => {
      setCurrentMood(moods[Math.floor(Math.random() * moods.length)]);
    }, 10000); // Đổi mood mỗi 10 giây

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
      default:
        return 'from-blue-500 to-purple-600';
    }
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
          title={t('ai.title')}
        >
          {/* Robot Icon với animation */}
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

          {/* Thinking indicator */}
          {currentMood === 'thinking' && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-ping" />
          )}
        </button>

        {/* Tooltip */}
        {isHovered && (
          <div className="absolute bottom-20 right-0 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg whitespace-nowrap animate-fadeIn">
            <div className="flex items-center space-x-2">
              <HelpCircle className="w-4 h-4" />
              <span>{t('ai.subtitle')}</span>
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
                  {t('ai.title')}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {currentMood === 'thinking' 
                    ? 'Đang suy nghĩ...' 
                    : currentMood === 'excited'
                    ? 'Sẵn sàng giúp đỡ!'
                    : t('ai.welcome').split('\n')[0]
                  }
                </p>
                <div className="flex space-x-2 mt-2">
                  <button
                    onClick={handleClick}
                    className="text-xs bg-blue-500 text-white px-3 py-1 rounded-full hover:bg-blue-600 transition-colors"
                  >
                    {t('ai.suggestions.howToBook')}
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

        {/* Thinking bubble */}
        {currentMood === 'thinking' && !isHovered && (
          <div className="absolute bottom-20 right-0 bg-yellow-100 dark:bg-yellow-900 rounded-2xl shadow-lg p-3 animate-slideUp">
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce delay-200" />
              </div>
              <span className="text-xs text-yellow-800 dark:text-yellow-200">
                Đang suy nghĩ...
              </span>
            </div>
            {/* Arrow */}
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-yellow-100 dark:border-t-yellow-900" />
          </div>
        )}
      </div>

      {/* AI Assistant Modal */}
      <AIAssistant isOpen={showChat} onClose={handleClose} />
    </>
  );
};

export default AnimatedAIAssistant;
