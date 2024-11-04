const mongoose = require('mongoose');

const Reels = new mongoose.Schema({
    reelId: { type: String, required: true },
    caption: { type: String, required: true },
    videoUrl: { type: String, required: true },
    createdAt: { type: String, required: true },
    likesCount: { type: Number, required: true },
    commentsCount: { type: Number, required: true },
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    userImageUrl: { type: String, required: true },
    isLiked: { type: Boolean, required: true },
    isOwnPost:{type: Boolean, required: true}
});

module.exports =  mongoose.model('reel', Reels);
