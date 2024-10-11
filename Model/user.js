const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    image: { type: String, required: true },
    type: { type: String, required: true }
});

const Users = mongoose.model('Users', studentSchema);

module.exports = Users
