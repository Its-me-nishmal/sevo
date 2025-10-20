const express = require('express');
const { searchUsers, getFriends, updateProfile, getUserById } = require('../controllers/userController');
const { uploadProfilePhoto } = require('../middleware/profileUpload');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// @desc    Search user by email
// @route   GET /users/search?email=
// @access  Private
router.get('/search', protect, searchUsers);

// @desc    Get list of friends
// @route   GET /users/friends
// @access  Private
router.get('/friends', protect, getFriends);

// @desc    Update user profile
// @route   PUT /users/profile
// @access  Private
router.put('/profile', protect, uploadProfilePhoto, updateProfile);

// @desc    Get user by ID
// @route   GET /users/:id
// @access  Private
router.get('/:id', protect, getUserById);

module.exports = router;