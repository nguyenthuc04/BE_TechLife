const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    idMentor: { type: String, required: true },
    rating: { type: String, required: true },
    comment: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
    date: { type: String, required: true }
});

module.exports = mongoose.model('review', reviewSchema);
