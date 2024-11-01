const mongoose = require('mongoose');

const Comments = new mongoose.Schema({
    commentId: { type: String, required: true },
    content: { type: String, required: true },
    postId: { type: String, required: true },
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    userImageUrl: { type: String, required: true },
    createAt: { type: String, required: true }
});

module.exports = mongoose.model('comment', Comments);

