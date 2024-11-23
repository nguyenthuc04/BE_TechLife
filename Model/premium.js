const mongoose = require('mongoose');

const premiumSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    userImageUrl: { type: String, required: true },
    imageUrl: { type: String , required: true }
});

const Premium = mongoose.model('Premium', premiumSchema);

module.exports = Premium
