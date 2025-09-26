import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Smile, Phone, Video, MoreVertical, ArrowLeft } from 'lucide-react';

const ChatInterface = ({ 
  conversation, 
  messages = [], 
  currentUser, 
  onSendMessage, 
  onFileUpload,
  onBack,
  onlineStatus,
  isTyping,
  onTyping 
}) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (message.trim() && conversation) {
      onSendMessage({
        receiverId: conversation.participant._id,
        content: message.trim(),
        messageType: 'text'
      });
      setMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTyping = (value) => {
    setMessage(value);
    
    // Emit typing indicator
    if (onTyping) {
      onTyping(true);
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 1000);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && conversation) {
      onFileUpload({
        receiverId: conversation.participant._id,
        file,
        messageType: file.type.startsWith('image/') ? 'image' : 'file'
      });
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  const groupMessagesByDate = (messages) => {
    const groups = {};
    messages.forEach(msg => {
      const date = new Date(msg.createdAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(msg);
    });
    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  // Show empty state if no messages
  if (messages.length === 0) {
    messageGroups['today'] = [];
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
          <p className="text-sm">Choose a conversation from the list to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img
                src={conversation.participant.profilePicture || '/assets/images/no_image.png'}
                alt={`${conversation.participant.firstName} ${conversation.participant.lastName}`}
                className="h-10 w-10 rounded-full object-cover"
              />
              {onlineStatus && (
                <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
              )}
            </div>
            <div>
              <h3 className="font-medium text-gray-900">
                {conversation.participant.firstName} {conversation.participant.lastName}
              </h3>
              <p className="text-sm text-gray-500 capitalize">
                {conversation.participant.role}
                {onlineStatus && <span className="text-green-500 ml-2">• Online</span>}
                {isTyping && <span className="text-blue-500 ml-2">• Typing...</span>}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <Phone className="h-5 w-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <Video className="h-5 w-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <MoreVertical className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-lg font-medium mb-2">No messages yet</h3>
              <p className="text-sm">Start the conversation with {conversation.participant.firstName}</p>
            </div>
          </div>
        ) : (
          Object.entries(messageGroups).map(([date, dayMessages]) => (
            <div key={date}>
              {/* Date Separator */}
              <div className="flex justify-center mb-4">
                <div className="bg-white px-3 py-1 rounded-full text-xs text-gray-500 shadow-sm">
                  {formatDate(dayMessages[0].createdAt)}
                </div>
              </div>

              {/* Messages for this date */}
              {dayMessages.map((msg, index) => {
                const isCurrentUser = msg.sender._id === currentUser.userId;
                const showAvatar = !isCurrentUser && (
                  index === 0 || 
                  dayMessages[index - 1].sender._id !== msg.sender._id
                );

                return (
                  <div
                    key={msg._id}
                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-2`}
                  >
                    <div className={`flex ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2 max-w-xs lg:max-w-md`}>
                      {showAvatar && !isCurrentUser && (
                        <img
                          src={msg.sender.profilePicture || '/assets/images/no_image.png'}
                          alt={msg.sender.firstName}
                          className="h-6 w-6 rounded-full object-cover"
                        />
                      )}
                      {!showAvatar && !isCurrentUser && <div className="w-6" />}

                      <div
                        className={`px-3 py-2 rounded-lg ${
                          isCurrentUser
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                        }`}
                      >
                        {msg.messageType === 'image' ? (
                          <div>
                            <img
                              src={msg.fileUrl}
                              alt={msg.fileName}
                              className="max-w-full h-auto rounded-lg mb-1"
                            />
                            {msg.content && (
                              <p className="text-sm">{msg.content}</p>
                            )}
                          </div>
                        ) : msg.messageType === 'file' ? (
                          <div className="flex items-center space-x-2">
                            <Paperclip className="h-4 w-4" />
                            <div>
                              <p className="text-sm font-medium">{msg.fileName}</p>
                              <p className="text-xs opacity-75">
                                {(msg.fileSize / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        )}

                        <div className={`flex items-center justify-end mt-1 space-x-1 ${
                          isCurrentUser ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          <span className="text-xs">{formatTime(msg.createdAt)}</span>
                          {isCurrentUser && (
                            <div className="flex space-x-1">
                              <div className={`w-3 h-3 ${msg.isDelivered ? 'text-blue-100' : 'text-blue-300'}`}>
                                ✓
                              </div>
                              {msg.isRead && (
                                <div className="w-3 h-3 text-blue-100">✓</div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-end space-x-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*,.pdf,.txt,.doc,.docx"
            className="hidden"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-600"
          >
            <Paperclip className="h-5 w-5" />
          </button>

          <div className="flex-1 relative">
            <textarea
              value={message}
              onChange={(e) => handleTyping(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              rows={1}
              className="w-full px-4 py-2 border border-gray-300 rounded-full resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{
                minHeight: '40px',
                maxHeight: '120px'
              }}
            />
          </div>

          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-600"
          >
            <Smile className="h-5 w-5" />
          </button>

          <button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className={`p-2 rounded-full ${
              message.trim()
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;