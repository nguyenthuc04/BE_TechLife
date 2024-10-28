const express = require('express');
const router = express.Router();
const Course = require('../Model/course');


router.get('/getListCourses', async (req, res) => {
    try {
        const courses = await Course.find();
        res.json(courses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi lấy danh sách khóa học!' });
    }
});


router.get('/getCourse/:id', async (req, res) => {
    try {
        const courseId = req.params.id;
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Không tìm thấy khóa học với ID cung cấp!' });
        }
        res.json(course);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi lấy thông tin khóa học!' });
    }
});


router.post('/addCourse', async (req, res) => {
    try {
        const { name, date, price, duration } = req.body;

        console.log(req.body);
        const course = new Course({ name, date, price, duration });

        await course.save();

        res.status(201).json(course);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi tạo khóa học!' });
    }
});

router.put('/updateCourse/:id', async (req, res) => {
    try {
        const courseId = req.params.id;
        const { name, date, price, duration } = req.body;

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Không tìm thấy khóa học với ID cung cấp!' });
        }

        course.name = name;
        course.date = date;
        course.price = price;
        course.duration = duration;

        await course.save();
        res.json(course);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi cập nhật khóa học!' });
    }
});

// API xóa khóa học
router.delete('/deleteCourse/:id', async (req, res) => {
    try {
        const courseId = req.params.id;
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Không tìm thấy khóa học với ID cung cấp!' });
        }

        // Xóa khóa học
        await course.remove();
        res.status(204).send(); // Trả về 204 No Content
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi xóa khóa học!' });
    }
});

module.exports = router;
