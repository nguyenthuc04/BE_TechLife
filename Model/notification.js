const mongoose = require('mongoose');

const Notifications = new mongoose.Schema({
    name: { type: String, required: true }, // Name of the user
    message: { type: String, required: true }, // Notification message
    image: { type: String, required: true }, // URL of the image
    time: { type: String, required: true }, // Time of the notification
    idPostReel: { type: String, required: true }, // Associated post/reel ID
    myID: { type: String, required: true }, // ID of the logged-in user
    yourID: { type: String, required: true } // ID of the other user involved
});
module.exports =  mongoose.model('notification', Notifications);