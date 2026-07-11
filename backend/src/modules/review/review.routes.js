const express = require('express');
const router = express.Router();
const reviewController = require('./review.controller');
const { protect } = require('../../middleware/auth.middleware');

router.get('/mentor/:mentorProfileId', reviewController.getReviewsByMentor);
router.post('/', protect, reviewController.createReview);

module.exports = router;
