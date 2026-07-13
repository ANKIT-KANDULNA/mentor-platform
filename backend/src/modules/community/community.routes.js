const express = require('express');
const router = express.Router();
const communityController = require('./community.controller');
const { protect } = require('../../middleware/auth.middleware');

// All routes require authentication
router.use(protect);

// Community CRUD
router.get('/', communityController.getAllCommunities);
router.post('/', communityController.createCommunity);
router.get('/:communityId', communityController.getCommunityById);

// Membership
router.post('/:communityId/join', communityController.joinCommunity);
router.delete('/:communityId/leave', communityController.leaveCommunity);

// Messages (REST fallback for history)
router.get('/:communityId/messages', communityController.getCommunityMessages);

module.exports = router;
