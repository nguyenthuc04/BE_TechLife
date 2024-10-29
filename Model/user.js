const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    account: { type: String, required: true },
    password: { type: String, required: true },
    birthday: { type: String, required: true },
    name: { type: String, required: true },
    avatar: { type: String, required: true },
    following: { type: String, required: true },
    followers: { type: String, required: true },
    bio: { type: String, required: true },
    posts: { type: String, required: true },
    accountType: { type: String, required: true },
});

const Users = mongoose.model('Users', UserSchema);

module.exports = Users
