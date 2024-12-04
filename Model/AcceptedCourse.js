const mongoose = require('mongoose');

const AcceptedCourseSchema = new mongoose.Schema({
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    acceptedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AcceptedCourse', AcceptedCourseSchema);

