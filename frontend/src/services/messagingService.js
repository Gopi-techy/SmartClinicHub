import { io } from 'socket.io-client';

class MessagingService {
  constructor() {
    this.socket = null;
    this.apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    this.isConnected = false;
    this.currentUser = null;
  }

  // Get current token
  getCurrentToken() {
    return localStorage.getItem('authToken');
  }

  // Initialize Socket.IO connection
  connect(user, token) {
    console.log('🔌 Connecting to messaging service...', { user: user?.userId, hasToken: !!token });
    
    if (this.socket) {
      this.disconnect();
    }

    this.currentUser = user;
    
    // Use current origin in development to go through Vite proxy
    const socketUrl = import.meta.env.DEV ? window.location.origin : this.apiUrl;
    console.log('🔗 Socket.IO connecting to:', socketUrl);
    
    this.socket = io(socketUrl, {
      auth: {
        token
      },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to messaging server', this.socket.id);
      this.isConnected = true;
      
      // Authenticate user
      this.socket.emit('authenticate', {
        userId: user.userId,
        token
      });
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from messaging server');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.isConnected = false;
    });

    return this.socket;
  }

  // Disconnect from Socket.IO
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Join a conversation room
  joinConversation(conversationId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('joinConversation', { conversationId });
    }
  }

  // Leave a conversation room
  leaveConversation(conversationId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leaveConversation', { conversationId });
    }
  }

  // Send typing indicator
  emitTyping(conversationId, isTyping) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing', { conversationId, isTyping });
    }
  }

  // API Methods

  // Get auth headers
  getAuthHeaders() {
    const token = this.getCurrentToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // Get conversations
  async getConversations() {
    try {
      console.log('📞 Fetching conversations...');
      const response = await fetch(`${this.apiUrl}/api/messaging/conversations`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();
      console.log('📞 Conversations response:', data);
      return data;
    } catch (error) {
      console.error('❌ Error fetching conversations:', error);
      return { success: false, message: 'Failed to fetch conversations' };
    }
  }

  // Get conversation messages
  async getConversation(userId, page = 1, limit = 50) {
    try {
      const response = await fetch(
        `${this.apiUrl}/api/messaging/conversation/${userId}?page=${page}&limit=${limit}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders()
        }
      );

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching conversation:', error);
      return { success: false, message: 'Failed to fetch conversation' };
    }
  }

  // Send a text message
  async sendMessage(receiverId, content, messageType = 'text', replyToId = null) {
    try {
      // Validate inputs
      if (!receiverId) {
        return { success: false, message: 'Receiver ID is required' };
      }

      if (!content || content.trim().length === 0) {
        return { success: false, message: 'Message content cannot be empty' };
      }

      if (content.length > 2000) {
        return { success: false, message: 'Message content cannot exceed 2000 characters' };
      }

      const validMessageTypes = ['text', 'image', 'file', 'appointment_request', 'prescription'];
      if (!validMessageTypes.includes(messageType)) {
        return { success: false, message: 'Invalid message type' };
      }

      console.log('📤 Sending message with data:', {
        receiverId,
        content,
        messageType,
        replyToId,
        contentLength: content?.length,
        receiverIdType: typeof receiverId
      });

      // Prepare request body, excluding null values
      const requestBody = {
        receiverId,
        content,
        messageType
      };

      // Only include replyToId if it's not null/undefined
      if (replyToId) {
        requestBody.replyToId = replyToId;
      }

      const response = await fetch(`${this.apiUrl}/api/messaging/send`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Send message error:', data);
        console.error('Detailed error info:', {
          status: response.status,
          statusText: response.statusText,
          errors: data.errors,
          message: data.message,
          details: data.details
        });
        return { 
          success: false, 
          message: data.message || data.error || 'Failed to send message',
          details: data.details || data.errors || null
        };
      }
      
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, message: 'Failed to send message' };
    }
  }

  // Send a file message
  async sendFileMessage(receiverId, file, messageType = 'file', replyToId = null) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('receiverId', receiverId);
      formData.append('messageType', messageType);
      if (replyToId) {
        formData.append('replyToId', replyToId);
      }

      const token = this.getCurrentToken();
      const response = await fetch(`${this.apiUrl}/api/messaging/send-file`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error sending file message:', error);
      return { success: false, message: 'Failed to send file message' };
    }
  }

  // Mark messages as read
  async markMessagesAsRead(senderId) {
    try {
      const response = await fetch(`${this.apiUrl}/api/messaging/mark-read/${senderId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return { success: false, message: 'Failed to mark messages as read' };
    }
  }

  // Get unread message count
  async getUnreadCount() {
    try {
      const response = await fetch(`${this.apiUrl}/api/messaging/unread-count`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return { success: false, message: 'Failed to fetch unread count' };
    }
  }

  // Delete a message
  async deleteMessage(messageId) {
    try {
      const response = await fetch(`${this.apiUrl}/api/messaging/message/${messageId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error deleting message:', error);
      return { success: false, message: 'Failed to delete message' };
    }
  }

  // Search conversations
  async searchConversations(query) {
    try {
      const response = await fetch(
        `${this.apiUrl}/api/messaging/search?q=${encodeURIComponent(query)}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders()
        }
      );

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error searching conversations:', error);
      return { success: false, message: 'Failed to search conversations' };
    }
  }

  // Get online users
  async getOnlineUsers() {
    try {
      const response = await fetch(`${this.apiUrl}/api/messaging/online-users`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching online users:', error);
      return { success: false, message: 'Failed to fetch online users' };
    }
  }

  // Get all available doctors
  async getAllDoctors(page = 1, limit = 50) {
    try {
      const response = await fetch(
        `${this.apiUrl}/api/users/public/doctors?page=${page}&limit=${limit}`, 
        {
          method: 'GET',
          headers: this.getAuthHeaders()
        }
      );

      const data = await response.json();
      if (data.success) {
        return { 
          success: true, 
          doctors: data.data.doctors,
          pagination: data.data.pagination 
        };
      }
      return { success: false, message: 'Failed to fetch doctors' };
    } catch (error) {
      console.error('Error fetching doctors:', error);
      return { success: false, message: 'Failed to fetch doctors' };
    }
  }

  // Get all patients (for doctors to message)
  async getAllPatients(page = 1, limit = 50) {
    try {
      const response = await fetch(
        `${this.apiUrl}/api/appointments/doctor/all-patients?page=${page}&limit=${limit}`, 
        {
          method: 'GET',
          headers: this.getAuthHeaders()
        }
      );

      const data = await response.json();
      if (data.success) {
        return { 
          success: true, 
          patients: data.patients,
          pagination: {
            page: data.page,
            pages: data.pages,
            total: data.total
          }
        };
      }
      return { success: false, message: 'Failed to fetch patients' };
    } catch (error) {
      console.error('Error fetching patients:', error);
      return { success: false, message: 'Failed to fetch patients' };
    }
  }

  // Create a new conversation with a doctor
  async createNewConversation(doctorId) {
    try {
      const response = await fetch(`${this.apiUrl}/api/messaging/create-conversation`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ receiverId: doctorId })
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return { success: false, message: 'Failed to create conversation' };
    }
  }

  // Event Listeners

  // Listen for new messages
  onMessage(callback) {
    if (this.socket) {
      this.socket.on('newMessage', callback);
    }
  }

  // Listen for message sent confirmation
  onMessageSent(callback) {
    if (this.socket) {
      this.socket.on('messageSent', callback);
    }
  }

  // Listen for messages read
  onMessagesRead(callback) {
    if (this.socket) {
      this.socket.on('messagesRead', callback);
    }
  }

  // Listen for message deleted
  onMessageDeleted(callback) {
    if (this.socket) {
      this.socket.on('messageDeleted', callback);
    }
  }

  // Listen for typing indicators
  onUserTyping(callback) {
    if (this.socket) {
      this.socket.on('userTyping', callback);
    }
  }

  // Listen for user online status
  onUserOnline(callback) {
    if (this.socket) {
      this.socket.on('userOnline', callback);
    }
  }

  // Listen for user offline status
  onUserOffline(callback) {
    if (this.socket) {
      this.socket.on('userOffline', callback);
    }
  }

  // Listen for delivery confirmations
  onDeliveryConfirmation(callback) {
    if (this.socket) {
      this.socket.on('deliveryConfirmation', callback);
    }
  }

  // Remove event listeners
  offMessage(callback) {
    if (this.socket) {
      this.socket.off('newMessage', callback);
    }
  }

  offMessageSent(callback) {
    if (this.socket) {
      this.socket.off('messageSent', callback);
    }
  }

  offMessagesRead(callback) {
    if (this.socket) {
      this.socket.off('messagesRead', callback);
    }
  }

  offMessageDeleted(callback) {
    if (this.socket) {
      this.socket.off('messageDeleted', callback);
    }
  }

  offUserTyping(callback) {
    if (this.socket) {
      this.socket.off('userTyping', callback);
    }
  }

  offUserOnline(callback) {
    if (this.socket) {
      this.socket.off('userOnline', callback);
    }
  }

  offUserOffline(callback) {
    if (this.socket) {
      this.socket.off('userOffline', callback);
    }
  }

  offDeliveryConfirmation(callback) {
    if (this.socket) {
      this.socket.off('deliveryConfirmation', callback);
    }
  }

  // Utility Methods

  // Generate conversation ID for two users
  generateConversationId(userId1, userId2) {
    return [userId1, userId2].sort().join('_');
  }

  // Check if user is online
  isUserOnline(userId) {
    // This would typically be managed by a state management system
    // For now, we'll implement a simple check
    return false;
  }

  // Format message time
  formatMessageTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now - date;
    const diffInHours = diffInMs / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'now';
    } else if (diffInHours < 24) {
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
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id || null
    };
  }
}

// Create singleton instance
const messagingService = new MessagingService();

export default messagingService;