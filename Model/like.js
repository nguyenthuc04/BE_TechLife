const mongoose = require('mongoose');

const Likes = new mongoose.Schema({
    postId: { type: String, required: true },
    userId: { type: String, required: true },
});

module.exports = mongoose.model('like', Likes);