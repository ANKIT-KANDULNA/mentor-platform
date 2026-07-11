const express = require('express');
const router = express.Router();
const notificationController = require('./notification.controller');
const { protect } = require('../../middleware/auth.middleware');

router.use(protect);

router.get('/', notificationController.getNotifications);
router.patch('/:notificationId/read', notificationController.markRead);
router.patch('/read-all', notificationController.markAllRead);

module.exports = router;
