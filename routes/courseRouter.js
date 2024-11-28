const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Course = require('../Model/course');


router.post('/createCourse', async (req, res) => {
    try {
        const { name, quantity, imageUrl, price, duration, describe, userId, userName, userImageUrl,startDate,endDate,type } = req.body;

        if (!name || !quantity || !imageUrl || !price || !duration || !describe || !userId || !userName || !userImageUrl || !startDate || !endDate || !type) {
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
            userImageUrl,
            startDate,
            endDate,
            type
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
router.get('/getCoursesByDate', async (req, res) => {
    try {
        const { startDate, endDate } = req.query; // Lấy startDate và endDate từ query string

        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'Vui lòng cung cấp ngày bắt đầu và ngày kết thúc!' });
        }

        // Kiểm tra xem startDate và endDate có phải là chuỗi hợp lệ không
        if (!isValidDateString(startDate) || !isValidDateString(endDate)) {
            return res.status(400).json({ message: 'Ngày bắt đầu hoặc ngày kết thúc không hợp lệ!' });
        }

        // Truy vấn các khóa học trong khoảng thời gian
        const courses = await Course.find({
            date: { $gte: startDate, $lte: endDate } // So sánh chuỗi ngày tháng
        });

        if (courses.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy khóa học trong khoảng thời gian này!' });
        }

        res.json(courses.length);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi lấy thông tin khóa học!' });
    }
});

// Hàm kiểm tra chuỗi ngày hợp lệ
function isValidDateString(dateString) {
    // Kiểm tra xem chuỗi có đúng định dạng "YYYY-MM-DD" không
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    return regex.test(dateString);
}

// Lấy thông tin khóa học theo tên
router.get('/getCoursesByName/:name', async (req, res) => {
    try {
        const name = req.params.name;

        if (!name || name.trim() === "") {
            return res.status(400).json({ success: false, message: 'Invalid course name' });
        }

        // Tìm kiếm khóa học có tên khớp với từ khóa (không phân biệt chữ hoa, chữ thường)
        const courses = await Course.find({ name: { $regex: name, $options: 'i' } });

        if (!courses.length) {
            return res.status(404).json({ success: false, message: 'No courses found with this name' });
        }

        res.status(200).json({ success: true,message : "HEhe",data : courses });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'An unexpected error has occurred, try again!' });
    }
});

router.put('/registerCourse/:courseId', async (req, res) => {
    try {
        console.log("Request Body:", req.body); // Add this log to see the incoming data

        const { courseId } = req.params;
        const { id, userName, avatar, date } = req.body;

        // Check if courseId is valid
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({ success: false, message: 'Invalid courseId' });
        }

        // Check if required fields are provided in the request body
        if (!id || !userName || !avatar || !date) {
            return res.status(400).json({ success: false, message: 'Missing required fields: id, username, avatar, date' });
        }

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        // Check if the user is already registered for this course
        const userAlreadyRegistered = course.user.some(user => user.id.toString() === id);
        if (userAlreadyRegistered) {
            return res.status(400).json({ success: false, message: 'User is already registered for this course' });
        }

        // If user is not already registered, add the user to the course's user list
        await Course.findByIdAndUpdate(
            courseId,
            {
                $push: {
                    user: {
                         id, // Save id as userId
                        userName,
                        avatar,
                        date,
                    },
                },
            },
            { new: true, runValidators: true }
        );

        // Fetch the updated course and return it in the response
        const updatedCourse = await Course.findById(courseId);
        res.status(200).json({ success: true, message: 'User registered successfully', course: updatedCourse });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'An unexpected error has occurred, try again!' });
    }
});


module.exports = router;
