const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    id: { type: String, required: true },
    userName: { type: String, required: true },
    avatar: { type: String , required: true },
    date: { type: String, required: true },
});

const courseSchema = new mongoose.Schema({
    name: { type: String, required: true },
    quantity: { type: String, required: true },
    imageUrl: { type: String, required: true },
    date: { type: Date, default: Date.now },
    price: { type: String, required: true },
    duration: { type: String, required: true },
    describe: { type: String, required: true },
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    userImageUrl: { type: String, required: true },
    user: { type:[userSchema], default: [] },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    type: { type: String, required: true },
});

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;
