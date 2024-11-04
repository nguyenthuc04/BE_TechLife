const mongoose = require('mongoose');

const Likereel = new mongoose.Schema({
    reelId: { type: String, required: true },
    userId: { type: String, required: true },
});

module.exports = mongoose.model('likereel', Likereel);