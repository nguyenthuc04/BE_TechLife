const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    userImageUrl: { type: String, required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Reels = new mongoose.Schema({
    caption: { type: String, required: true },
    videoUrl: { type: [String] },
    createdAt: { type: String, required: true },
    likesCount: { type: Number, required: true },
    commentsCount: { type: Number, required: true },
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    userImageUrl: { type: String, required: true },
    isLiked: { type: Boolean, required: true },
    isOwnPost: { type: Boolean, required: true },
    likes: { type: [String], default: [] },
    comments: { type: [CommentSchema], default: [] }
});

module.exports =  mongoose.model('reel', Reels);
