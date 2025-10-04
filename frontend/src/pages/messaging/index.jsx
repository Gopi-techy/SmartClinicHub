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

  // Prevent body scroll on messaging page
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
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
        const currentUserId = user.userId || user.id;
        if (message.sender._id !== currentUserId) {
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
          // Update the existing conversation
          updatedConversations[existingIndex] = {
            ...updatedConversations[existingIndex],
            lastMessage: message,
            unreadCount: message.sender._id !== (user.userId || user.id) ? 
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
      const currentUserId = user.userId || user.id;
      setMessages(prev => 
        prev.map(msg => 
          msg.sender._id === currentUserId && msg.receiver._id === readBy
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
      user.userId || user.id, 
      selectedConversation.participant._id
    );
    messagingService.joinConversation(conversationId);

    return () => {
      messagingService.leaveConversation(conversationId);
    };
  }, [selectedConversation, user?.userId]);

  // Handle sending a message
  const handleSendMessage = async (messageData) => {
    console.log('🔄 Attempting to send message:', { messageData, user, selectedConversation });
    
    if (!selectedConversation) {
      console.error('No conversation selected');
      return;
    }

    // Validate user data
    if (!user || (!user.userId && !user.id)) {
      console.error('User or userId/id not available:', user);
      return;
    }

    // Use the correct user ID field
    const currentUserId = user.userId || user.id;

    // Validate message data
    if (!messageData.receiverId) {
      console.error('No receiver ID provided');
      return;
    }

    // Validate receiverId format (should be 24-character MongoDB ObjectId)
    if (typeof messageData.receiverId !== 'string' || messageData.receiverId.length !== 24) {
      console.error('Invalid receiver ID format:', messageData.receiverId);
      return;
    }

    if (!messageData.content || messageData.content.trim().length === 0) {
      console.error('Message content is empty');
      return;
    }

    if (messageData.content.length > 2000) {
      console.error('Message content too long');
      return;
    }

    console.log('✅ Message validation passed, creating temp message...');

    // Create a temporary message to show immediately in UI
    const tempMessage = {
      _id: `temp_${Date.now()}`,
      content: messageData.content,
      messageType: messageData.messageType || 'text',
      sender: {
        _id: currentUserId,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicture: user.profilePicture
      },
      receiver: {
        _id: selectedConversation.participant._id,
        firstName: selectedConversation.participant.firstName,
        lastName: selectedConversation.participant.lastName
      },
      createdAt: new Date().toISOString(),
      isDelivered: false,
      isRead: false
    };

    // Add message to UI immediately
    setMessages(prev => [...prev, tempMessage]);

    try {
      // Send the actual message
      const result = await messagingService.sendMessage(
        messageData.receiverId,
        messageData.content,
        messageData.messageType || 'text',
        messageData.replyToId
      );

      if (result.success) {
        // Replace temp message with real message
        setMessages(prev => prev.map(msg => 
          msg._id === tempMessage._id ? result.data : msg
        ));
        
        // Update conversations list
        setConversations(prev => {
          const updatedConversations = [...prev];
          const existingIndex = updatedConversations.findIndex(
            conv => conv.participant._id === selectedConversation.participant._id
          );

          const newConversationData = {
            participant: selectedConversation.participant,
            lastMessage: result.data,
            unreadCount: 0
          };

          if (existingIndex >= 0) {
            updatedConversations[existingIndex] = newConversationData;
            // Move to top
            const conversation = updatedConversations.splice(existingIndex, 1)[0];
            updatedConversations.unshift(conversation);
          } else {
            // Add new conversation to the top
            updatedConversations.unshift(newConversationData);
          }

          return updatedConversations;
        });
      } else {
        // Remove temp message on failure
        setMessages(prev => prev.filter(msg => msg._id !== tempMessage._id));
        console.error('Failed to send message:', result.message);
        console.error('Detailed send error:', {
          result,
          messageData,
          selectedConversation: selectedConversation?.participant,
          user: {
            id: user?.id,
            userId: user?.userId,
            email: user?.email
          }
        });
        // TODO: Show user-friendly error notification
      }
    } catch (error) {
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => msg._id !== tempMessage._id));
      console.error('Error sending message:', error);
      // TODO: Show user-friendly error notification
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
        user.userId || user.id,
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

      <div className="fixed inset-0 bg-background overflow-hidden">
        <RoleBasedHeader />
        {isPatient && <PatientSidebar />}
        {isDoctor && <ProviderSidebar />}
        {isPatient && <PatientBottomTabs />}

        {/* Main Content - positioned to avoid overlaps */}
        <div className={`absolute top-16 ${isPatient ? 'bottom-20 md:bottom-0 left-0 right-0 md:left-64' : 'bottom-0 left-0 right-0 md:left-80'} overflow-hidden`}>
          <div className="h-full flex overflow-hidden">
            {/* Desktop Layout */}
            <div className="hidden md:flex h-full w-full overflow-hidden">
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
            <div className="md:hidden h-full w-full overflow-hidden">
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