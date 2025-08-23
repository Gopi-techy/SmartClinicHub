import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import messagingService from '../../utils/messagingService';
import Button from '../ui/Button';
import Icon from '../AppIcon';

const ChatInterface = ({ conversationId, onClose }) => {
  const { user, userProfile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [conversation, setConversation] = useState(null);
  const messagesEndRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load messages and conversation details
  useEffect(() => {
    if (!conversationId || !user?.id) return;

    const loadMessages = async () => {
      setLoading(true);
      
      // Load conversation details first
      const conversationsResult = await messagingService.getConversations(user.id);
      if (conversationsResult?.success) {
        const currentConversation = conversationsResult.data.find(
          conv => conv.id === conversationId
        );
        setConversation(currentConversation);
      }

      // Load messages
      const messagesResult = await messagingService.getMessages(conversationId);
      if (messagesResult?.success) {
        setMessages(messagesResult.data || []);
        // Mark messages as read
        messagingService.markMessagesAsRead(conversationId, user.id);
      }
      
      setLoading(false);
    };

    loadMessages();

    // Subscribe to real-time updates
    const subscription = messagingService.subscribeToMessages(
      conversationId,
      ({ type, message }) => {
        if (type === 'new_message') {
          setMessages(prev => [...prev, message]);
          // Mark as read if not sent by current user
          if (message.sender_id !== user.id) {
            messagingService.markMessagesAsRead(conversationId, user.id);
          }
        }
      }
    );

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [conversationId, user?.id]);

  // Send a message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    
    const result = await messagingService.sendMessage(
      conversationId, 
      newMessage.trim()
    );
    
    if (result?.success) {
      setNewMessage('');
    } else {
      alert(result?.error || 'Failed to send message');
    }
    
    setSending(false);
  };

  // Format message timestamp
  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now - date;
    const diffInHours = diffInMs / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  // Get chat partner info
  const getChatPartner = () => {
    if (!conversation || !userProfile) return null;
    
    return userProfile.role === 'patient' 
      ? conversation.doctor 
      : conversation.patient;
  };

  const chatPartner = getChatPartner();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center space-x-2 text-muted-foreground">
          <Icon name="Loader" className="animate-spin" />
          <span>Loading chat...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background rounded-lg border border-border">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            {chatPartner?.avatar_url ? (
              <img 
                src={chatPartner.avatar_url} 
                alt={chatPartner.full_name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <Icon name="User" className="w-5 h-5 text-primary" />
            )}
          </div>
          <div>
            <h3 className="font-medium text-foreground">
              {chatPartner?.full_name || 'Unknown User'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {conversation?.subject || 'General Consultation'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            iconName="Phone"
            className="text-muted-foreground hover:text-foreground"
          />
          <Button
            variant="ghost"
            size="sm"
            iconName="Video"
            className="text-muted-foreground hover:text-foreground"
          />
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              iconName="X"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            />
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <Icon name="MessageCircle" className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No messages yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Start the conversation with {chatPartner?.full_name}
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.sender_id === user?.id;
            
            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-1' : 'order-2'}`}>
                  <div
                    className={`rounded-lg px-4 py-2 ${
                      isOwnMessage
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    {message.is_urgent && (
                      <div className="flex items-center mt-1">
                        <Icon name="AlertTriangle" className="w-3 h-3 text-orange-500 mr-1" />
                        <span className="text-xs text-orange-500">Urgent</span>
                      </div>
                    )}
                  </div>
                  <div className={`flex items-center mt-1 space-x-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-xs text-muted-foreground">
                      {formatMessageTime(message.created_at)}
                    </span>
                    {isOwnMessage && (
                      <Icon 
                        name={message.status === 'read' ? 'CheckCheck' : 'Check'} 
                        className={`w-3 h-3 ${message.status === 'read' ? 'text-blue-500' : 'text-muted-foreground'}`}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-border p-4">
        <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
          <div className="flex-1">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              disabled={sending}
            />
          </div>
          <Button
            type="submit"
            size="sm"
            iconName="Send"
            disabled={!newMessage.trim() || sending}
            className="shrink-0"
          >
            {sending ? (
              <Icon name="Loader" className="animate-spin" />
            ) : (
              <Icon name="Send" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;