const mongoose = require('mongoose');

const AcceptedReviewSchema = new mongoose.Schema({
    reviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'review', required: true },
    acceptedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AcceptedReview', AcceptedReviewSchema);

