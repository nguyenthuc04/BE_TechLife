const mongoose = require('mongoose');

const Posts = new mongoose.Schema({
    postId: { type: String, required: true },
    caption: { type: String, required: true },
    imageUrl: { type: String, required: true },
    createdAt: { type: String, required: true },
    likesCount: { type: Number, required: true },
    commentsCount: { type: Number, required: true },
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    userImageUrl: { type: String, required: true },
    isLiked: { type: Boolean, required: true },
    isOwnPost:{type: Boolean, required: true}
});

module.exports =  mongoose.model('post', Posts);
