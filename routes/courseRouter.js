const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Course = require('../Model/course');


router.post('/createCourse', async (req, res) => {
    try {
        const { name, quantity, imageUrl, price, duration, describe, userId, userName, userImageUrl } = req.body;

        if (!name || !quantity || !imageUrl || !price || !duration || !describe || !userId || !userName || !userImageUrl) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        const newCourse = new Course({
            name,
            quantity,
            imageUrl,
            date : new Date().toISOString(),
            price,
            duration,
            describe,
            userId,
            userName,
            userImageUrl
        });

        await newCourse.save();
        res.status(201).json({ success: true, message: 'Course created successfully', course: newCourse });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'An unexpected error has occurred, try again!' });
    }
});



// Lấy danh sách khóa học
router.get('/getListCourses', async (req, res) => {
    try {
        const courses = await Course.find();
        res.json(courses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi lấy danh sách khóa học!' });
    }
});

// Lấy thông tin khóa học theo ID
router.get('/getCoursesByUser/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: 'Invalid userId' });
        }

        const courses = await Course.find({ userId });
        if (!courses.length) {
            return res.status(404).json({ success: false, message: 'No courses found for this user' });
        }

        res.status(200).json({ success: true, courses });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'An unexpected error has occurred, try again!' });
    }
});

router.get('/getCourseById/:courseId', async (req, res) => {
    try {
        const courseId = req.params.courseId;

        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({ success: false, message: 'Invalid courseId' });
        }

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        res.status(200).json({ success: true, course });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'An unexpected error has occurred, try again!' });
    }
});

router.put('/updateCourse/:courseId', async (req, res) => {
    try {
        const courseId = req.params.courseId;
        const { name, quantity, imageUrl, price, duration, describe } = req.body;

        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({ success: false, message: 'Invalid courseId' });
        }

        const updatedCourse = await Course.findByIdAndUpdate(
            courseId,
            { name, quantity, imageUrl, price, duration, describe },
            { new: true, runValidators: true }
        );

        if (!updatedCourse) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        res.status(200).json({ success: true, message: 'Course updated successfully', course: updatedCourse });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'An unexpected error has occurred, try again!' });
    }
});

router.delete('/deleteCourse/:courseId', async (req, res) => {
    try {
        const courseId = req.params.courseId;

        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({ success: false, message: 'Invalid courseId' });
        }

        const deletedCourse = await Course.findByIdAndDelete(courseId);

        if (!deletedCourse) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        res.status(200).json({ success: true, message: 'Course deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'An unexpected error has occurred, try again!' });
    }
});



module.exports = router;
