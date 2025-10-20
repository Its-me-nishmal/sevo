const express = require('express');
const passport = require('passport');
const { generateToken, getCurrentUser, logout } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// @desc    Auth with Google
// @route   GET /auth/google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// @desc    Google auth callback
// @route   GET /auth/google/callback
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    // Successful authentication, redirect to frontend with token
    // Successful authentication, redirect to frontend with token
    const token = generateToken(req.user);
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  }
);

// @desc    Generate JWT token (for frontend to request after Google OAuth)
// @route   GET /auth/token
// router.get('/token', protect, (req, res) => {
//   const token = generateToken(req.user);
//   res.json({ token, user: req.user });
// });

// @desc    Get current user
// @route   GET /auth/current_user
router.get('/current_user', protect, getCurrentUser);

// @desc    Logout user
// @route   GET /auth/logout
router.get('/logout', logout);

module.exports = router;