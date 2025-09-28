import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../AppIcon';
import Button from './Button';

const MedicalChatWidget = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your medical assistant. I can help answer general health questions and provide medical information. Please remember that I'm not a substitute for professional medical advice. How can I help you today?",
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage.trim(),
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Send message to backend API
      const response = await fetch('/api/medical-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('token')}`
        },
        body: JSON.stringify({ message: userMessage.text })
      });

      if (response.ok) {
        const data = await response.json();
        const botMessage = {
          id: Date.now() + 1,
          text: data.response || 'I apologize, but I encountered an error processing your request. Please try again.',
          isBot: true,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        throw new Error('Failed to get response from medical assistant');
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: 'I apologize, but I\'m experiencing technical difficulties. Please try again later or contact support if the issue persists.',
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-6 w-96 h-[600px] bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col z-50 animate-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-primary/5 dark:bg-primary/10 rounded-t-lg">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
            <Icon name="Stethoscope" size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Medical Assistant</h3>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-muted-foreground">Online</span>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-colors"
        >
          <Icon name="X" size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
          >
            <div className={`flex items-start space-x-2 max-w-[85%] ${
              message.isBot ? 'flex-row' : 'flex-row-reverse space-x-reverse'
            }`}>
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.isBot 
                  ? 'bg-primary/20 text-primary' 
                  : 'bg-blue-500 text-white'
              }`}>
                {message.isBot ? (
                  <Icon name="Bot" size={16} />
                ) : (
                  <span className="text-xs font-bold">
                    {user?.firstName?.charAt(0) || 'U'}
                  </span>
                )}
              </div>

              {/* Message Bubble */}
              <div className={`rounded-lg p-3 shadow-sm ${
                message.isBot
                  ? 'bg-gray-100 dark:bg-gray-700 text-foreground'
                  : 'bg-primary text-primary-foreground'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                <p className={`text-xs mt-1 ${
                  message.isBot 
                    ? 'text-muted-foreground' 
                    : 'text-primary-foreground/70'
                }`}>
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                <Icon name="Bot" size={16} />
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a medical question..."
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
              rows="2"
              disabled={isLoading}
            />
          </div>
          <Button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            size="sm"
            className="h-12 w-12 rounded-lg"
            iconName="Send"
          />
        </div>
        
        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground mt-2 text-center">
          This AI assistant provides general information only. Always consult healthcare professionals for medical advice.
        </p>
      </div>
    </div>
  );
};

export default MedicalChatWidget;