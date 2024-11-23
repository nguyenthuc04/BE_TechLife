const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    name: { type: String, required: true },
    date: { type: String, required: true },
    price: { type: String, required: true },
    duration: { type: String, required: true },
    describe: { type: String, required: true },
    idUser: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true } // Tham chiếu đến bảng Users
});

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;