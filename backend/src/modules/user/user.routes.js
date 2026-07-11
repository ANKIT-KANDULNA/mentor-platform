const express = require('express');
const router = express.Router();
const userController = require('./user.controller');
const { protect } = require('../../middleware/auth.middleware');

router.use(protect);

router.get('/profile', userController.getProfile);
router.patch('/profile', userController.updateProfile);
router.patch('/settings', userController.updateSettings);
router.delete('/', userController.deactivateAccount);

module.exports = router;
