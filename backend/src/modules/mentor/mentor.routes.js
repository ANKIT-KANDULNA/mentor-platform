const express = require('express');
const router = express.Router();
const mentorController = require('./mentor.controller');
const { protect } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');
const { validate } = require('../../middleware/validate.middleware');
const { updateMentorProfileSchema } = require('../../validators/mentor.validator');

router.get('/', mentorController.getMentors);
router.get('/me', protect, mentorController.getMyProfile);
router.patch('/profile', protect, authorize('MENTOR'), validate(updateMentorProfileSchema), mentorController.updateProfile);
router.get('/:mentorId', mentorController.getMentorById);

module.exports = router;