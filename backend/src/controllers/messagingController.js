const Message = require('../models/Message');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs').promises;

// In-memory store for online users (in production, use Redis)
const onlineUsers = new Map();

// Helper function to add user to online users
const addOnlineUser = (userId, socketId) => {
  onlineUsers.set(userId, {
    socketId,
    lastSeen: new Date(),
    isActive: true
  });
};

// Helper function to remove user from online users
const removeOnlineUser = (userId) => {
  onlineUsers.delete(userId);
};

// Helper function to get online status
const isUserOnline = (userId) => {
  return onlineUsers.has(userId);
};

// Send a new message
const sendMessage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { receiverId, content, messageType = 'text', replyToId, metadata } = req.body;
    const senderId = req.user._id;

    // Check if receiver exists and is not the same as sender
    if (senderId === receiverId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send message to yourself'
      });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Receiver not found'
      });
    }

    // Check if users are allowed to message each other
    // Patients can only message doctors and vice versa
    const sender = await User.findById(senderId);
    if (sender.role === receiver.role) {
      return res.status(403).json({
        success: false,
        message: 'Users with the same role cannot message each other'
      });
    }

    // Create the message
    const messageData = {
      sender: senderId,
      receiver: receiverId,
      content,
      messageType,
      metadata
    };

    if (replyToId) {
      const replyMessage = await Message.findById(replyToId);
      if (!replyMessage) {
        return res.status(404).json({
          success: false,
          message: 'Reply message not found'
        });
      }
      messageData.replyTo = replyToId;
    }

    const message = new Message(messageData);
    await message.save();

    // Populate the message with sender and receiver details
    await message.populate([
      { path: 'sender', select: 'firstName lastName profilePicture role' },
      { path: 'receiver', select: 'firstName lastName profilePicture role' },
      { path: 'replyTo' }
    ]);

    // Emit real-time message via Socket.IO
    if (req.io) {
      const receiverSocketInfo = onlineUsers.get(receiverId);
      if (receiverSocketInfo) {
        req.io.to(receiverSocketInfo.socketId).emit('newMessage', message);
      }
      
      // Also emit to sender for confirmation
      const senderSocketInfo = onlineUsers.get(senderId);
      if (senderSocketInfo) {
        req.io.to(senderSocketInfo.socketId).emit('messageSent', message);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Send message with file attachment
const sendFileMessage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { receiverId, messageType = 'file', replyToId } = req.body;
    const senderId = req.user._id;

    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(req.file.mimetype)) {
      // Delete uploaded file
      await fs.unlink(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'File type not allowed'
      });
    }

    if (req.file.size > maxSize) {
      // Delete uploaded file
      await fs.unlink(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum 10MB allowed'
      });
    }

    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      // Delete uploaded file
      await fs.unlink(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Receiver not found'
      });
    }

    // Create the message with file details
    const messageData = {
      sender: senderId,
      receiver: receiverId,
      content: req.file.originalname,
      messageType: req.file.mimetype.startsWith('image/') ? 'image' : 'file',
      fileUrl: `/uploads/${req.file.filename}`,
      fileName: req.file.originalname,
      fileSize: req.file.size
    };

    if (replyToId) {
      const replyMessage = await Message.findById(replyToId);
      if (replyMessage) {
        messageData.replyTo = replyToId;
      }
    }

    const message = new Message(messageData);
    await message.save();

    await message.populate([
      { path: 'sender', select: 'firstName lastName profilePicture role' },
      { path: 'receiver', select: 'firstName lastName profilePicture role' },
      { path: 'replyTo' }
    ]);

    // Emit real-time message via Socket.IO
    if (req.io) {
      const receiverSocketInfo = onlineUsers.get(receiverId);
      if (receiverSocketInfo) {
        req.io.to(receiverSocketInfo.socketId).emit('newMessage', message);
      }
    }

    res.status(201).json({
      success: true,
      message: 'File message sent successfully',
      data: message
    });

  } catch (error) {
    console.error('Send file message error:', error);
    // Clean up uploaded file on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all conversations for the authenticated user
const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const conversations = await Message.getUserConversations(userId);

    // Add online status to participants
    const conversationsWithStatus = conversations.map(conv => ({
      ...conv,
      participant: {
        ...conv.participant,
        isOnline: isUserOnline(conv.participant._id.toString())
      }
    }));

    res.json({
      success: true,
      data: conversationsWithStatus
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get conversation between authenticated user and another user
const getConversation = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { userId: otherUserId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const currentUserId = req.user._id;

    const messages = await Message.getConversation(
      currentUserId,
      otherUserId,
      parseInt(page),
      parseInt(limit)
    );

    // Reverse messages to show oldest first
    messages.reverse();

    res.json({
      success: true,
      data: {
        messages,
        pagination: {
          currentPage: parseInt(page),
          limit: parseInt(limit),
          hasMore: messages.length === parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Mark messages as read
const markMessagesAsRead = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { userId: senderId } = req.params;
    const receiverId = req.user._id;

    const result = await Message.markAsRead(senderId, receiverId);

    // Emit read receipt via Socket.IO
    if (req.io) {
      const senderSocketInfo = onlineUsers.get(senderId);
      if (senderSocketInfo) {
        req.io.to(senderSocketInfo.socketId).emit('messagesRead', {
          readBy: receiverId,
          count: result.modifiedCount
        });
      }
    }

    res.json({
      success: true,
      message: 'Messages marked as read',
      data: { markedCount: result.modifiedCount }
    });

  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get unread message count
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const unreadCount = await Message.getUnreadCount(userId);

    res.json({
      success: true,
      data: { unreadCount }
    });

  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete a message (soft delete)
const deleteMessage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Only sender can delete their own messages
    if (message.sender.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this message'
      });
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    message.deletedBy = userId;
    await message.save();

    // Emit deletion via Socket.IO
    if (req.io) {
      const receiverSocketInfo = onlineUsers.get(message.receiver.toString());
      if (receiverSocketInfo) {
        req.io.to(receiverSocketInfo.socketId).emit('messageDeleted', {
          messageId: message._id
        });
      }
    }

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Search conversations
const searchConversations = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { q } = req.query;
    const userId = req.user._id;

    const messages = await Message.find({
      $or: [
        { sender: userId },
        { receiver: userId }
      ],
      content: { $regex: q, $options: 'i' },
      isDeleted: false
    })
    .populate('sender', 'firstName lastName profilePicture role')
    .populate('receiver', 'firstName lastName profilePicture role')
    .sort({ createdAt: -1 })
    .limit(20);

    res.json({
      success: true,
      data: messages
    });

  } catch (error) {
    console.error('Search conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get online users
const getOnlineUsers = async (req, res) => {
  try {
    const onlineUserIds = Array.from(onlineUsers.keys());
    const users = await User.find(
      { _id: { $in: onlineUserIds } },
      'firstName lastName profilePicture role isActive'
    );

    res.json({
      success: true,
      data: users
    });

  } catch (error) {
    console.error('Get online users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Report a message
const reportMessage = async (req, res) => {
  try {
    // Implementation for reporting messages
    // This would typically create a report record in the database
    res.json({
      success: true,
      message: 'Message reported successfully'
    });
  } catch (error) {
    console.error('Report message error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Create a new conversation
const createConversation = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { receiverId } = req.body;
    const senderId = req.user._id;

    // Check if receiver exists and is not the same as sender
    if (senderId === receiverId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create conversation with yourself'
      });
    }

    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Receiver not found'
      });
    }

    // Check user roles - patients can only message doctors and vice versa
    const sender = await User.findById(senderId);
    if (sender.role === receiver.role) {
      return res.status(403).json({
        success: false,
        message: `${sender.role}s can only message ${sender.role === 'patient' ? 'doctors' : 'patients'}`
      });
    }

    // Check if a conversation already exists
    const existingMessages = await Message.findOne({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId }
      ]
    });

    if (existingMessages) {
      // Conversation already exists
      // Get the conversation details
      const conversations = await Message.getUserConversations(senderId);
      const existingConversation = conversations.find(c => 
        c.participant._id.toString() === receiverId
      );
      
      return res.json({
        success: true,
        message: 'Conversation already exists',
        data: existingConversation || { participant: receiver }
      });
    }

    // Create initial message
    const initialMessage = new Message({
      sender: senderId,
      receiver: receiverId,
      content: `Hello, I'd like to start a conversation.`,
      messageType: 'text'
    });

    await initialMessage.save();

    // Get the conversation
    const conversations = await Message.getUserConversations(senderId);
    const newConversation = conversations.find(c => 
      c.participant._id.toString() === receiverId
    );

    res.status(201).json({
      success: true,
      message: 'Conversation created successfully',
      data: newConversation || { participant: receiver }
    });

  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Block user
const blockUser = async (req, res) => {
  try {
    // Implementation for blocking users
    // This would typically update the user's blocked users list
    res.json({
      success: true,
      message: 'User blocked successfully'
    });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Unblock user
const unblockUser = async (req, res) => {
  try {
    // Implementation for unblocking users
    res.json({
      success: true,
      message: 'User unblocked successfully'
    });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get blocked users
const getBlockedUsers = async (req, res) => {
  try {
    // Implementation for getting blocked users
    res.json({
      success: true,
      data: []
    });
  } catch (error) {
    console.error('Get blocked users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Admin: Get all messages
const getAllMessages = async (req, res) => {
  try {
    // Only admin can access this
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ isDeleted: false })
      .populate('sender', 'firstName lastName email role')
      .populate('receiver', 'firstName lastName email role')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Message.countDocuments({ isDeleted: false });

    res.json({
      success: true,
      data: {
        messages,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalMessages: total,
          hasMore: skip + messages.length < total
        }
      }
    });

  } catch (error) {
    console.error('Get all messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Admin: Delete message permanently
const adminDeleteMessage = async (req, res) => {
  try {
    // Only admin can access this
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { messageId } = req.params;
    await Message.findByIdAndDelete(messageId);

    res.json({
      success: true,
      message: 'Message permanently deleted'
    });

  } catch (error) {
    console.error('Admin delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  sendMessage,
  sendFileMessage,
  getConversations,
  getConversation,
  markMessagesAsRead,
  getUnreadCount,
  deleteMessage,
  searchConversations,
  getOnlineUsers,
  reportMessage,
  createConversation,
  blockUser,
  unblockUser,
  getBlockedUsers,
  getAllMessages,
  adminDeleteMessage,
  // Helper functions for Socket.IO
  addOnlineUser,
  removeOnlineUser,
  isUserOnline,
  onlineUsers
};