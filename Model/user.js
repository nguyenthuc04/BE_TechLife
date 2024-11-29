const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    account: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    birthday: { type: String, required: true },
    name: { type: String, required: true },
    nickname: { type: String, required: true },
    bio: { type: String },
    avatar: { type: String },
    accountType: { type: String, required: true },
    following: { type: [String], default: [] },
    followers: { type: [String], default: [] },
    posts: { type: [String], default: [] },
    lastLog : { type: Date, default: Date.now }
});

const Users = mongoose.model('Users', userSchema);

module.exports = Users

