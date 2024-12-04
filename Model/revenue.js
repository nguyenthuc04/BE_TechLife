const mongoose = require('mongoose');

const revenueSchema = new mongoose.Schema({
    idUser: { type: String, required: true },
    type: { type: String, required: true },
    price: { type: String, required: true },
    date: { type: Date, default: Date.now },
    idStaff: { type: String, required: true }
});

const Revenue = mongoose.model('Revenues', revenueSchema);

module.exports = Revenue

