const express = require('express');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const Reels = require('../Model/reel'); // Sử dụng model Reels thay vì Posts

const router = express.Router();
const upload = multer({ dest: 'uploads/' }); // Đặt thư mục tải lên cho video

// Middleware xác thực
const authenticate = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ success: false, message: 'Chưa xác thực' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ success: false, message: 'Bị từ chối' });
        req.user = user;
        next();
    });
};

router.use(authenticate);

// Tạo reel mới
router.post('/createReel', upload.single('file'), async (req, res) => {
    try {
        let fileName = req.file ? req.file.filename : '';
        let reelDataParams = req.body.reel_data ? JSON.parse(req.body.reel_data) : null;

        if (!reelDataParams) {
            if (fileName) fs.unlinkSync(path.join('uploads/', fileName));
            return res.status(400).json({ success: false, message: 'Không thể phân tích dữ liệu reel' });
        }

        const videoUrl = `${req.protocol}://${req.get('host')}/uploads/${fileName}`;
        const newReel = new Reels({
            ...reelDataParams,
            videoUrl,
            createdAt: new Date().toISOString()
        });

        await newReel.save();
        res.status(201).json(newReel);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Có lỗi xảy ra, vui lòng thử lại!' });
    }
});

// Lấy reel cụ thể theo ID
router.get('/getReel/:reelId', async (req, res) => {
    try {
        const reelId = req.params.reelId;
        const reel = await Reels.findById(reelId);
        if (!reel) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy reel' });
        }
        res.json(reel);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Có lỗi xảy ra, vui lòng thử lại!' });
    }
});

// Xóa reel cụ thể theo ID
router.delete('/deleteReel/:reelId', async (req, res) => {
    try {
        const reelId = req.params.reelId;
        const reel = await Reels.findByIdAndDelete(reelId);

        if (!reel) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy reel' });
        }

        // Xóa video khỏi hệ thống nếu tồn tại
        const videoPath = path.join('uploads/', path.basename(reel.videoUrl));
        if (fs.existsSync(videoPath)) {
            fs.unlinkSync(videoPath);
        }

        res.json({ success: true, message: 'Xóa reel thành công' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Có lỗi xảy ra, vui lòng thử lại!' });
    }
});

// Lấy danh sách feed reel
router.get('/getFeed', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 0;
        const limit = parseInt(req.query.limit) || 10;

        const reels = await Reels.find()
            .sort({ createdAt: -1 })
            .skip(page * limit)
            .limit(limit);

        res.json(reels);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Có lỗi xảy ra, vui lòng thử lại!' });
    }
});

// Lấy danh sách reel của một người dùng cụ thể
router.get('/getUserReels/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const reels = await Reels.find({ user_id: userId })
            .sort({ createdAt: -1 });

        res.json(reels);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Có lỗi xảy ra, vui lòng thử lại!' });
    }
});

module.exports = router;
