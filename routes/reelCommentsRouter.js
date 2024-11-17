const express = require('express');
const jwt = require('jsonwebtoken');
const CommentReel = require('../Model/commentreel'); // Đảm bảo có tệp Model phù hợp
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

// router.use(authenticate);

// Route để tạo bình luận
router.post('/createComment', async (req, res) => {
    try {
        const { reelId, userId, content, userName, userImageUrl } = req.body;

        if (!reelId || !userId || !content) {
            return res.status(400).json({ success: false, message: 'Thiếu dữ liệu cần thiết' });
        }

        const newComment = new CommentReel({
            reelId,
            userId,
            content,
            userName,
            userImageUrl,
            createdAt: new Date().toISOString()
        });

        await newComment.save();
        res.status(201).json(newComment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Đã xảy ra lỗi không mong muốn, vui lòng thử lại!' });
    }
});

// Route để lấy bình luận cho một reel cụ thể
router.get('/getComments/:reelId', async (req, res) => {
    try {
        const { reelId } = req.params;
        const page = parseInt(req.query.page) || 0;
        const limit = parseInt(req.query.limit) || 10;

        const comments = await CommentReel.find({ reelId })
            .sort({ createdAt: -1 })
            .skip(page * limit)
            .limit(limit);

        res.json(comments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Đã xảy ra lỗi không mong muốn, vui lòng thử lại!' });
    }
});

// Route để xóa bình luận theo ID
router.delete('/deleteComment/:commentReelId', async (req, res) => {
    try {
        const { commentReelId } = req.params;
        const comment = await CommentReel.findByIdAndDelete(commentReelId);

        if (!comment) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy bình luận' });
        }

        res.json({ success: true, message: 'Bình luận đã được xóa thành công' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Đã xảy ra lỗi không mong muốn, vui lòng thử lại!' });
    }
});

// Route để lấy tất cả bình luận của một người dùng cụ thể
router.get('/getUserComments/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const comments = await CommentReel.find({ userId })
            .sort({ createdAt: -1 });

        res.json(comments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Đã xảy ra lỗi không mong muốn, vui lòng thử lại!' });
    }
});

module.exports = router;
