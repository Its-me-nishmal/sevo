const express = require('express');
const { sendVoiceMessage, getMessages, deleteExpiredMessages, markMessageAsRead, getUnreadMessageCounts } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/upload');

const router = express.Router();

// @desc    Send a voice message (upload + save + emit)
// @route   POST /messages/send
// @access  Private
router.post('/send', protect, upload.single('audio'), sendVoiceMessage);

// @desc    Get unread message counts for the authenticated user
// @route   GET /messages/unreadCounts
// @access  Private
router.get('/unreadCounts', protect, getUnreadMessageCounts);

// @desc    Fetch all messages between sender and receiver
// @route   GET /messages/:receiverId
// @access  Private
router.get('/:receiverId', protect, getMessages);

// @desc    Delete expired (24h+) messages (used by cron)
// @route   DELETE /messages/expired
// @access  Private (internal use by cron job)
router.delete('/expired', protect, deleteExpiredMessages); // This route is primarily for internal cron job, but protected for safety

// @desc    Mark a voice message as read and update its lifespan
// @route   PUT /messages/:id/read
// @access  Private
router.put('/:id/read', protect, markMessageAsRead);

module.exports = router;