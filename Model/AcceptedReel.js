const mongoose = require('mongoose');

const AcceptedReelSchema = new mongoose.Schema({
    reelId: { type: mongoose.Schema.Types.ObjectId, ref: 'reel', required: true },
    acceptedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AcceptedReel', AcceptedReelSchema);

