const express = require('express');
const router = express.Router();
const sessionController = require('./session.controller');
const { protect } = require('../../middleware/auth.middleware');

router.use(protect);

router.post('/', sessionController.createSession);
router.get('/', sessionController.getSessions);
router.get('/:sessionId', sessionController.getSessionById);
router.post('/:sessionId/join', sessionController.joinSession);
router.post('/:sessionId/leave', sessionController.leaveSession);
router.patch('/:sessionId/status', sessionController.updateSessionStatus);

module.exports = router;
