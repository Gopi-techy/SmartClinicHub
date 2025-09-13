// Messaging Service for SmartClinicHub
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const messagingService = {
  async getConversations(userId) {
    try {
      const response = await api.get(`/messages/conversations?userId=${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return { success: false, message: error.message || 'Failed to fetch conversations' };
    }
  },

  async getMessages(conversationId) {
    try {
      const response = await api.get(`/messages/conversations/${conversationId}/messages`);
      return response.data;
    } catch (error) {
      console.error('Error fetching messages:', error);
      return { success: false, message: error.message || 'Failed to fetch messages' };
    }
  },

  async sendMessage(conversationId, senderId, content) {
    try {
      const response = await api.post(`/messages/conversations/${conversationId}/messages`, { 
        senderId, 
        content 
      });
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, message: error.message || 'Failed to send message' };
    }
  },

  async startNewConversation(participantIds, subject, initialMessageContent) {
    try {
      const response = await api.post('/messages/conversations', { 
        participantIds, 
        subject, 
        initialMessageContent 
      });
      return response.data;
    } catch (error) {
      console.error('Error starting new conversation:', error);
      return { success: false, message: error.message || 'Failed to start new conversation' };
    }
  },

  async markMessageAsRead(conversationId, messageId) {
    try {
      const response = await api.put(`/messages/conversations/${conversationId}/messages/${messageId}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking message as read:', error);
      return { success: false, message: error.message || 'Failed to mark message as read' };
    }
  },

  async markConversationAsRead(conversationId) {
    try {
      const response = await api.put(`/messages/conversations/${conversationId}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking conversation as read:', error);
      return { success: false, message: error.message || 'Failed to mark conversation as read' };
    }
  },

  async deleteMessage(conversationId, messageId) {
    try {
      const response = await api.delete(`/messages/conversations/${conversationId}/messages/${messageId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting message:', error);
      return { success: false, message: error.message || 'Failed to delete message' };
    }
  },

  async deleteConversation(conversationId) {
    try {
      const response = await api.delete(`/messages/conversations/${conversationId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      return { success: false, message: error.message || 'Failed to delete conversation' };
    }
  },

  async updateConversation(conversationId, updates) {
    try {
      const response = await api.put(`/messages/conversations/${conversationId}`, updates);
      return response.data;
    } catch (error) {
      console.error('Error updating conversation:', error);
      return { success: false, message: error.message || 'Failed to update conversation' };
    }
  },

  // Real-time subscription methods (these would connect to Socket.IO in production)
  subscribeToConversations(userId, callback) {
    // In production, this would establish a Socket.IO connection
    console.log(`Subscribing user ${userId} to conversation updates`);
    
    // Return a mock subscription object
    return {
      unsubscribe: () => {
        console.log(`Unsubscribing user ${userId} from conversation updates`);
      }
    };
  },

  subscribeToMessages(conversationId, callback) {
    // In production, this would establish a Socket.IO connection
    console.log(`Subscribing to messages for conversation ${conversationId}`);
    
    // Return a mock subscription object
    return {
      unsubscribe: () => {
        console.log(`Unsubscribing from messages for conversation ${conversationId}`);
      }
    };
  },
};

export default messagingService;