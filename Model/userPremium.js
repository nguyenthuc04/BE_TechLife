const mongoose = require('mongoose');

const userPremiumSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
});

const UserPremium = mongoose.model('UserPremium', userPremiumSchema);

module.exports = UserPremium
