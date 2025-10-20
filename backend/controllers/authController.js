const jwt = require('jsonwebtoken');

// @desc    Get current user
// @route   GET /auth/current_user
// @access  Private
exports.getCurrentUser = (req, res) => {
  if (req.user) {
    res.json(req.user);
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
};

// @desc    Logout user
// @route   GET /auth/logout
// @access  Public
exports.logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: 'Logout failed' });
    }
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Session destruction failed' });
      }
      res.clearCookie('connect.sid'); // Clear session cookie
      res.json({ message: 'Logged out successfully' });
    });
  });
};

// @desc    Generate JWT token
// @route   POST /auth/token
// @access  Private (after successful Google OAuth)
exports.generateToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });
};