const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { body, param, query } = require('express-validator');
const messagingController = require('../controllers/messagingController');
const { upload } = require('../middleware/upload');

// Validation middleware
const validateSendMessage = [
  body('receiverId')
    .isMongoId()
    .withMessage('Valid receiver ID is required'),
  body('content')
    .optional()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message content must be between 1 and 2000 characters'),
  body('messageType')
    .optional()
    .isIn(['text', 'image', 'file', 'appointment_request', 'prescription'])
    .withMessage('Invalid message type'),
  body('replyToId')
    .optional()
    .isMongoId()
    .withMessage('Valid reply message ID is required')
];

const validateGetConversation = [
  param('userId')
    .isMongoId()
    .withMessage('Valid user ID is required'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

const validateMarkAsRead = [
  param('userId')
    .isMongoId()
    .withMessage('Valid user ID is required')
];

const validateDeleteMessage = [
  param('messageId')
    .isMongoId()
    .withMessage('Valid message ID is required')
];

// Routes

// Test route first
router.get('/test', (req, res) => {
  res.json({ message: 'Messaging routes working' });
});

// Send a new message
router.post('/send', authenticate, validateSendMessage, messagingController.sendMessage);

// Get all conversations for the authenticated user
router.get('/conversations', authenticate, messagingController.getConversations);

// Get conversation between authenticated user and another user
router.get('/conversation/:userId', authenticate, validateGetConversation, messagingController.getConversation);

// Mark messages as read
router.put('/mark-read/:userId', authenticate, validateMarkAsRead, messagingController.markMessagesAsRead);

// Get unread message count
router.get('/unread-count', authenticate, messagingController.getUnreadCount);

// Delete a message (soft delete)
router.delete('/message/:messageId', authenticate, validateDeleteMessage, messagingController.deleteMessage);

// Search conversations
router.get('/search', authenticate, [
  query('q')
    .isLength({ min: 1 })
    .withMessage('Search query is required')
], messagingController.searchConversations);

// Get online users (for showing online status)
router.get('/online-users', authenticate, messagingController.getOnlineUsers);

// Report a message
router.post('/report/:messageId', authenticate, [
  param('messageId')
    .isMongoId()
    .withMessage('Valid message ID is required'),
  body('reason')
    .isLength({ min: 1, max: 500 })
    .withMessage('Report reason is required and must be less than 500 characters')
], messagingController.reportMessage);

// Block/Unblock user
router.put('/block/:userId', authenticate, [
  param('userId')
    .isMongoId()
    .withMessage('Valid user ID is required')
], messagingController.blockUser);

router.put('/unblock/:userId', authenticate, [
  param('userId')
    .isMongoId()
    .withMessage('Valid user ID is required')
], messagingController.unblockUser);

// Get blocked users
router.get('/blocked-users', authenticate, messagingController.getBlockedUsers);

// Admin routes for message management
router.get('/admin/all-messages', authenticate, messagingController.getAllMessages);
router.delete('/admin/message/:messageId', authenticate, messagingController.adminDeleteMessage);

module.exports = router;