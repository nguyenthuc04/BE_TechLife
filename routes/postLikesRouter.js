const express = require('express');
const jwt = require('jsonwebtoken');
const Likes = require('../Model/like'); // Đảm bảo có tệp Model phù hợp
const router = express.Router();

// Middleware để xác thực người dùng
const authenticate = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ success: false, message: 'Forbidden' });
        req.user = user;
        next();
    });
};

router.use(authenticate);

// Route để thêm lượt thích
router.post('/addLike', async (req, res) => {
    try {
        const { postId, userId } = req.body;

        if (!postId || !userId) {
            return res.status(400).json({ success: false, message: 'Thiếu dữ liệu cần thiết' });
        }

        const newLike = new Likes({
            postId,
            userId,
            createdAt: new Date().toISOString()
        });

        await newLike.save();
        res.status(201).json({ success: true, message: 'Like added successfully', like: newLike });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Đã xảy ra lỗi không mong muốn, vui lòng thử lại!' });
    }
});

// Route để xóa lượt thích
router.delete('/removeLike', async (req, res) => {
    try {
        const { postId, userId } = req.body;

        if (!postId || !userId) {
            return res.status(400).json({ success: false, message: 'Thiếu dữ liệu cần thiết' });
        }

        const like = await Likes.findOneAndDelete({ postId, userId });

        if (!like) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy lượt thích' });
        }

        res.json({ success: true, message: 'Like removed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Đã xảy ra lỗi không mong muốn, vui lòng thử lại!' });
    }
});

module.exports = router;
