const express = require('express');
const jwt = require('jsonwebtoken');
const Reels = require('../Model/reel'); // Import the Reel model

const router = express.Router();

// Middleware for authentication (Optional, uncomment if needed)
// const authenticate = (req, res, next) => {
//     const token = req.headers['authorization'];
//     if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });
//
//     jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
//         if (err) return res.status(403).json({ success: false, message: 'Forbidden' });
//         req.user = user;
//         next();
//     });
// };

// Route to create a reel
router.post('/createReel', async (req, res) => {
    try {
        let reelData;

        try {
            reelData = req.body.reel_data ? JSON.parse(req.body.reel_data) : null;
        } catch (error) {
            return res.status(400).json({ success: false, message: 'Could not parse reel data' });
        }

        if (!reelData) {
            return res.status(400).json({ success: false, message: 'Reel data is missing' });
        }

        // Get the image URL directly from the request
        const videoUrl = reelData.videoUrl || '';
        // Create new Reel object
        const newReel = new Reels({
            ...reelData,
            videoUrl,
            createdAt: new Date().toISOString(),
        });

        await newReel.save();
        res.status(201).json({ success: true, reel: newReel });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'An unexpected error has occurred, try again!' });
    }
});

// Route to update a specific reel by ID
router.put('/updateReel/:reelId', async (req, res) => {
    try {
        const reelId = req.params.reelId;
        const updatedData = req.body.reel_data ? JSON.parse(req.body.reel_data) : null;

        if (!updatedData) {
            return res.status(400).json({ success: false, message: 'Reel data is missing' });
        }

        // Check if the reel exists
        const reel = await Reels.findById(reelId);
        if (!reel) {
            return res.status(404).json({ success: false, message: 'Reel not found' });
        }

        // Update reel fields with the new data
        reel.caption = updatedData.caption || reel.caption;
        reel.videoUrl = updatedData.videoUrl || reel.videoUrl;
        reel.likesCount = updatedData.likesCount || reel.likesCount;
        reel.commentsCount = updatedData.commentsCount || reel.commentsCount;
        reel.isLiked = updatedData.isLiked || reel.isLiked;
        reel.isOwnPost = updatedData.isOwnPost || reel.isOwnPost;
        reel.userName = updatedData.userName || reel.userName;
        reel.userImageUrl = updatedData.userImageUrl || reel.userImageUrl;

        await reel.save();

        res.json({ success: true, message: 'Reel updated successfully', reel });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'An unexpected error has occurred, try again!' });
    }
});

// Route to delete a specific reel by ID
router.delete('/deleteReel/:reelId', async (req, res) => {
    try {
        const reelId = req.params.reelId;

        // Check if the reel exists
        const reel = await Reels.findById(reelId);
        if (!reel) {
            return res.status(404).json({ success: false, message: 'Reel not found' });
        }

        // Delete the reel
        await reel.remove();

        res.json({ success: true, message: 'Reel deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'An unexpected error has occurred, try again!' });
    }
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const AcceptedReel = require('../Model/AcceptedReel');
// API chấp nhận bài viết
router.put('/reelsQT/:id/accept', async (req, res) => {
    try {
        const reelId = req.params.id;
        const reel = await Reels.findById(reelId);
        if (!reel) {
            return res.status(404).json({ error: 'Không tìm thấy bài viết' });
        }

        // Kiểm tra xem bài viết đã được chấp nhận chưa
        const existingAcceptedReel = await AcceptedReel.findOne({ reelId });
        if (existingAcceptedReel) {
            return res.status(400).json({ error: 'Bài viết đã được chấp nhận trước đó' });
        }

        // Tạo một bản ghi mới trong collection AcceptedPost
        const acceptedReel = new AcceptedReel({ reelId });
        await acceptedReel.save();

        res.status(200).json({ message: 'Chấp nhận bài viết thành công', reel });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi khi chấp nhận bài viết' });
    }
});

// Cập nhật API lấy danh sách bài viết để chỉ trả về các bài viết chưa được chấp nhận
router.get('/reelsQT', async (req, res) => {
    try {
        const acceptedReelIds = await AcceptedReel.find().distinct('reelId');
        const reels = await Reels.find({ _id: { $nin: acceptedReelIds } });

        const processedReels = reels.map(reel => {
            if (Array.isArray(reel.videoUrl) && reel.videoUrl.length > 0) {
                reel.videoUrl = reel.videoUrl.map(url => url);
            } else {
                reel.videoUrl = [];
            }
            return reel;
        });

        res.status(200).json(processedReels);
    } catch (error) {
        res.status(500).json({ error: 'Lỗi khi lấy danh sách reels' });
    }
});

router.get('/reelsQT/accepted', async (req, res) => {
    try {
        const acceptedReels = await AcceptedReel.find().populate('reelId');
        const processedReels = acceptedReels.map(acceptedReels => {
            const reel = acceptedReels.reelId;
            return {
                ...reel.toObject(),
                acceptedAt: acceptedReels.acceptedAt
            };
        });
        res.status(200).json(processedReels);
    } catch (error) {
        console.error('Lỗi khi lấy danh sách reels đã chấp nhận:', error);
        res.status(500).json({ error: 'Lỗi khi lấy danh sách reels đã chấp nhận' });
    }
});

router.put('/reelsQT/:id/unarchive', async (req, res) => {
    try {
        const reelId = req.params.id;

        // Xóa bài viết khỏi danh sách đã chấp nhận
        await AcceptedReel.findOneAndDelete({ reelId: reelId });

        // Lấy thông tin bài viết
        const reel = await Reels.findById(reelId);

        if (!reel) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy reels' });
        }

        res.status(200).json({ success: true, message: 'Reels đã được hủy lưu trữ', reel: reel });
    } catch (error) {
        console.error('Lỗi khi hủy lưu trữ bài viết:', error);
        res.status(500).json({ success: false, error: 'Lỗi khi hủy lưu trữ reels' });
    }
});

// API xóa bài viết
router.delete('/reelsQT/:id', async (req, res) => {
    try {
        const reelId = req.params.id;
        const deletedReel = await Reels.findByIdAndDelete(reelId);
        if (!deletedReel) {
            return res.status(404).json({ error: 'Không tìm thấy reels' });
        }
        res.status(200).json({ message: 'Xóa reels thành công' });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi khi xóa reels' });
    }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports = router;
