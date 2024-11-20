const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
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

router.get('/getCoursesByUser/:idUser', async (req, res) => {
    try {
        const { idUser } = req.params;
        const courses = await Course.find({ idUser });

        res.json(courses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi lấy danh sách khóa học!' });
    }
});


router.post('/addCourse', async (req, res) => {
    try {
        const { name, date, price, duration, idUser } = req.body;

        // Kiểm tra nếu `idUser` không được cung cấp
        if (!idUser) {
            return res.status(400).json({ message: 'idUser là bắt buộc!' });
        }

        const course = new Course({ name, date, price, duration, idUser });

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

        // Kiểm tra xem ID có phải là ObjectId hợp lệ không
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({ message: 'ID không hợp lệ!' });
        }

        // Xóa khóa học
        const course = await Course.findByIdAndDelete(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Không tìm thấy khóa học với ID cung cấp!' });
        }

        res.status(204).send(); // Trả về 204 No Content
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi xóa khóa học!' });
    }
});

module.exports = router;
