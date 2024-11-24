const mongoose = require('mongoose');

const AcceptedPostSchema = new mongoose.Schema({
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    acceptedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AcceptedPost', AcceptedPostSchema);

