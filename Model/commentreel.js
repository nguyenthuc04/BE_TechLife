const mongoose = require('mongoose');

const Commentreel = new mongoose.Schema({
    commentReelId: { type: String, required: true },
    content: { type: String, required: true },
    reelId: { type: String, required: true },
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    userImageUrl: { type: String, required: true },
    createAt: { type: String, required: true }
});

module.exports = mongoose.model('commentreel', Commentreel);

