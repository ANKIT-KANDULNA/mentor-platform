const express = require('express');
const router = express.Router();
const dashboardController = require('./dashboard.controller');
const { protect } = require('../../middleware/auth.middleware');

router.get('/stats', protect, dashboardController.getStats);
router.get('/active-mentors', protect, dashboardController.getActiveMentors);
router.get('/upcoming-sessions', protect, dashboardController.getUpcomingSessions);

module.exports = router;