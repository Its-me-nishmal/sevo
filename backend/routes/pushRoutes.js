const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { subscribe, unsubscribe } = require('../controllers/pushController');

const router = express.Router();

router.route('/subscribe').post(protect, subscribe);
router.route('/unsubscribe').post(protect, unsubscribe);

module.exports = router;