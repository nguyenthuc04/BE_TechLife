const mongoose = require('mongoose');

const notificationSchema     = new mongoose.Schema({
    contentId: { type: String, required: true },
    userId: { type: String, required: true },
    imgUser: { type: String, required: true },
    nameUser: { type: String, required: true },
    yourID: { type: String, required: true },
    time: { type: String, required: true },
    read: { type: Boolean, required: true },
    processed: { type: Boolean, required: true },
    type: { type: String, enum: ['like', 'comment', 'other'], required: true },
    contentType: { type: String, enum: ['post', 'reel', 'other'], required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);
