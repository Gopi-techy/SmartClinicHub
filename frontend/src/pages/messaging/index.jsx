import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '../../contexts/AuthContext';
import messagingService from '../../services/messagingService';
import RoleBasedHeader from '../../components/ui/RoleBasedHeader';
import PatientBottomTabs from '../../components/ui/PatientBottomTabs';
import PatientSidebar from '../../components/ui/PatientSidebar';
import ProviderSidebar from '../../components/ui/ProviderSidebar';
import ConversationsList from '../../components/messaging/ConversationsList';
import ChatInterface from '../../components/messaging/ChatInterface';
import Button from '../../components/ui/Button';

const MessagingPage = () => {
  const navigate = useNavigate();
  const { user, loading, token, isAuthenticated } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showChatOnMobile, setShowChatOnMobile] = useState(false);

  // Check authentication
  useEffect(() => {
    console.log('🔐 MessagingPage Auth check:', { loading, user, isAuthenticated, hasToken: !!token });
    if (!loading && (!isAuthenticated || !user)) {
      console.log('❌ MessagingPage Redirecting to login - missing auth data');
      navigate('/login-registration');
      return;
    }
    console.log('✅ MessagingPage Auth check passed - staying on messaging page');
  }, [user, isAuthenticated, loading, navigate, token]);

  // Handle responsive view
  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    checkMobileView();
    window.addEventListener('resize', checkMobileView);
    return () => window.removeEventListener('resize', checkMobileView);
  }, []);

  // Initialize messaging service and load conversations
  useEffect(() => {
    if (!user || !token) {
      console.log('❌ Missing user or token for messaging:', { hasUser: !!user, hasToken: !!token });
      return;
    }

    const initializeMessaging = async () => {
      console.log('🚀 Initializing messaging for user:', user);
      setConversationsLoading(true);
      
      // Connect to Socket.IO
      messagingService.connect(user, token);

      // Load conversations
      const result = await messagingService.getConversations();
      console.log('📝 Conversations result:', result);
      if (result.success) {
        setConversations(result.data || []);
      } else {
        console.error('❌ Failed to load conversations:', result.message);
      }

      // Get online users
      const onlineResult = await messagingService.getOnlineUsers();
      console.log('👥 Online users result:', onlineResult);
      if (onlineResult.success) {
        setOnlineUsers(onlineResult.data.map(u => u._id));
      } else {
        console.error('❌ Failed to load online users:', onlineResult.message);
      }

      setConversationsLoading(false);
    };

    initializeMessaging();

    // Setup Socket.IO event listeners
    const handleNewMessage = (message) => {
      // Add message to current conversation if it's selected
      if (selectedConversation && 
          (message.sender._id === selectedConversation.participant._id || 
           message.receiver._id === selectedConversation.participant._id)) {
        setMessages(prev => [...prev, message]);
        
        // Mark as read if not sent by current user
        if (message.sender._id !== user.userId) {
          messagingService.markMessagesAsRead(message.sender._id);
        }
      }

      // Update conversations list
      setConversations(prev => {
        const updatedConversations = [...prev];
        const existingIndex = updatedConversations.findIndex(
          conv => conv.participant._id === message.sender._id || 
                  conv.participant._id === message.receiver._id
        );

        if (existingIndex >= 0) {
          updatedConversations[existingIndex] = {
            ...updatedConversations[existingIndex],
            lastMessage: message,
            unreadCount: message.sender._id !== user.userId ? 
              (updatedConversations[existingIndex].unreadCount || 0) + 1 : 0
          };
          // Move to top
          const conversation = updatedConversations.splice(existingIndex, 1)[0];
          updatedConversations.unshift(conversation);
        }

        return updatedConversations;
      });
    };

    const handleMessageSent = (message) => {
      // Message sent confirmation
      if (selectedConversation && 
          message.receiver._id === selectedConversation.participant._id) {
        setMessages(prev => [...prev, message]);
      }
    };

    const handleMessagesRead = ({ readBy, count }) => {
      // Update message read status
      setMessages(prev => 
        prev.map(msg => 
          msg.sender._id === user.userId && msg.receiver._id === readBy
            ? { ...msg, isRead: true, readAt: new Date() }
            : msg
        )
      );
    };

    const handleUserTyping = ({ userId, isTyping }) => {
      setTypingUsers(prev => ({
        ...prev,
        [userId]: isTyping
      }));
    };

    const handleUserOnline = ({ userId }) => {
      setOnlineUsers(prev => [...new Set([...prev, userId])]);
    };

    const handleUserOffline = ({ userId }) => {
      setOnlineUsers(prev => prev.filter(id => id !== userId));
    };

    // Register event listeners
    messagingService.onMessage(handleNewMessage);
    messagingService.onMessageSent(handleMessageSent);
    messagingService.onMessagesRead(handleMessagesRead);
    messagingService.onUserTyping(handleUserTyping);
    messagingService.onUserOnline(handleUserOnline);
    messagingService.onUserOffline(handleUserOffline);

    // Cleanup
    return () => {
      messagingService.offMessage(handleNewMessage);
      messagingService.offMessageSent(handleMessageSent);
      messagingService.offMessagesRead(handleMessagesRead);
      messagingService.offUserTyping(handleUserTyping);
      messagingService.offUserOnline(handleUserOnline);
      messagingService.offUserOffline(handleUserOffline);
      messagingService.disconnect();
    };
  }, [user, token, selectedConversation]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (!selectedConversation) return;

    const loadMessages = async () => {
      setMessagesLoading(true);
      const result = await messagingService.getConversation(selectedConversation.participant._id);
      
      if (result.success) {
        setMessages(result.data.messages || []);
        
        // Mark messages as read
        await messagingService.markMessagesAsRead(selectedConversation.participant._id);
        
        // Update conversation unread count
        setConversations(prev =>
          prev.map(conv =>
            conv.participant._id === selectedConversation.participant._id
              ? { ...conv, unreadCount: 0 }
              : conv
          )
        );
      }
      
      setMessagesLoading(false);
    };

    loadMessages();

    // Join conversation room for real-time updates
    const conversationId = messagingService.generateConversationId(
      user.userId, 
      selectedConversation.participant._id
    );
    messagingService.joinConversation(conversationId);

    return () => {
      messagingService.leaveConversation(conversationId);
    };
  }, [selectedConversation, user?.userId]);

  // Handle sending a message
  const handleSendMessage = async (messageData) => {
    const result = await messagingService.sendMessage(
      messageData.receiverId,
      messageData.content,
      messageData.messageType,
      messageData.replyToId
    );

    if (!result.success) {
      console.error('Failed to send message:', result.message);
      // You might want to show an error notification here
    }
  };

  // Handle file upload
  const handleFileUpload = async (fileData) => {
    const result = await messagingService.sendFileMessage(
      fileData.receiverId,
      fileData.file,
      fileData.messageType,
      fileData.replyToId
    );

    if (!result.success) {
      console.error('Failed to send file:', result.message);
      // You might want to show an error notification here
    }
  };

  // Handle typing indicator
  const handleTyping = (isTyping) => {
    if (selectedConversation) {
      const conversationId = messagingService.generateConversationId(
        user.userId,
        selectedConversation.participant._id
      );
      messagingService.emitTyping(conversationId, isTyping);
    }
  };

  // Handle conversation selection
  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    if (isMobileView) {
      setShowChatOnMobile(true);
    }
  };

  // Handle back to conversations on mobile
  const handleBackToConversations = () => {
    setShowChatOnMobile(false);
    setSelectedConversation(null);
  };

  // Check if user is typing
  const isUserTyping = selectedConversation ? 
    typingUsers[selectedConversation.participant._id] : false;

  // Check if user is online
  const isUserOnline = selectedConversation ?
    onlineUsers.includes(selectedConversation.participant._id) : false;

  // Show loading state
  if (loading) {
    console.log('⏳ MessagingPage showing loading state');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  console.log('🎯 MessagingPage rendering main content for user:', user?.email);

  const isPatient = user?.role === 'patient';
  const isDoctor = user?.role === 'doctor';

  return (
    <>
      <Helmet>
        <title>Messages - SmartClinicHub</title>
        <meta name="description" content="Secure messaging between patients and doctors on SmartClinicHub platform." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <RoleBasedHeader />
        {isPatient && <PatientBottomTabs />}
        {isPatient && <PatientSidebar />}
        {isDoctor && <ProviderSidebar />}

        {/* Main Content */}
        <div className={`pt-16 ${isPatient ? 'pb-20 md:pb-8 md:ml-64' : 'md:ml-80'}`}>
          <div className="h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)]">
            {/* Desktop Layout */}
            <div className="hidden md:flex h-full">
              {/* Conversations Sidebar */}
              <ConversationsList
                conversations={conversations}
                selectedConversation={selectedConversation}
                onSelectConversation={handleSelectConversation}
                currentUser={user}
                onlineUsers={onlineUsers}
                loading={conversationsLoading}
              />

              {/* Chat Area */}
              <ChatInterface
                conversation={selectedConversation}
                messages={messages}
                currentUser={user}
                onSendMessage={handleSendMessage}
                onFileUpload={handleFileUpload}
                onlineStatus={isUserOnline}
                isTyping={isUserTyping}
                onTyping={handleTyping}
                loading={messagesLoading}
              />
            </div>

            {/* Mobile Layout */}
            <div className="md:hidden h-full">
              {!showChatOnMobile ? (
                // Conversations List View
                <ConversationsList
                  conversations={conversations}
                  selectedConversation={selectedConversation}
                  onSelectConversation={handleSelectConversation}
                  currentUser={user}
                  onlineUsers={onlineUsers}
                  loading={conversationsLoading}
                />
              ) : (
                // Chat View
                <ChatInterface
                  conversation={selectedConversation}
                  messages={messages}
                  currentUser={user}
                  onSendMessage={handleSendMessage}
                  onFileUpload={handleFileUpload}
                  onBack={handleBackToConversations}
                  onlineStatus={isUserOnline}
                  isTyping={isUserTyping}
                  onTyping={handleTyping}
                  loading={messagesLoading}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MessagingPage;