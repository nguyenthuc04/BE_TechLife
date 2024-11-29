const express = require('express');
const jwt = require('jsonwebtoken');
const Reels = require('../Model/reel');
const mongoose = require("mongoose");
const Notification = require('../Model/notification');
const router = express.Router();

router.post('/addReelComment/:reelId', async (req, res) => {
    try {
        const reelId = req.params.reelId;
        const { userId, userName, userImageUrl, text, yourID } = req.body;

        if (!mongoose.Types.ObjectId.isValid(reelId) || !userId || !userName || !userImageUrl || !text || !yourID ) {
            return res.status(400).json({ success: false, message: 'Invalid input data' });
        }

        const reel = await Reels.findById(reelId);
        if (!reel) {
            return res.status(404).json({ success: false, message: 'Reel not found' });
        }

        const newComment = {
            userId,
            userName,
            userImageUrl,
            text,
            createdAt: new Date()
        };

        reel.comments.push(newComment);
        reel.commentsCount += 1;

        // Create a new comment notification
        const commentNotification = new Notification({
            contentId: reelId,
            userId,
            imgUser: userImageUrl,
            nameUser: userName,
            yourID,
            read: false,
            processed: false,
            time: new Date().toISOString(),
            type: 'comment',
            contentType : 'reel'
        });
        await commentNotification.save();

        await reel.save();

        res.status(201).json({ success: true, message: 'Comment added successfully', reel });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'An unexpected error has occurred, try again!' });
    }
});

router.post('/likeReel/:reelId', async (req, res) => {
    try {
        const reelId = req.params.reelId;
        const { userId, imgUser, nameUser, yourID } = req.body;

        if (!mongoose.Types.ObjectId.isValid(reelId) || !userId || !imgUser || !nameUser || !yourID) {
            return res.status(400).json({ success: false, message: 'Invalid input data' });
        }

        const reel = await Reels.findById(reelId);
        if (!reel) {
            return res.status(404).json({ success: false, message: 'Reel not found' });
        }

        const likeIndex = reel.likes.indexOf(userId);
        if (likeIndex === -1) {
            reel.likes.push(userId);
            reel.likesCount += 1;

            const likeNotification = new Notification({
                contentId: reelId,
                userId,
                imgUser,
                nameUser,
                yourID,
                read: false,
                processed: false,
                time: new Date().toISOString(),
                type: 'like',
                contentType : 'reel'
            });
            await likeNotification.save();

            message = 'Reel liked successfully';
        } else {
            reel.likes.splice(likeIndex, 1);
            reel.likesCount -= 1;
            message = 'Reel unliked successfully';
        }

        await reel.save();

        res.status(200).json({ success: true, message, reel });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'An unexpected error has occurred, try again!' });
    }
});


router.get('/getReelComments/:reelId', async (req, res) => {
    try {
        const reelId = req.params.reelId;

        if (!mongoose.Types.ObjectId.isValid(reelId)) {
            return res.status(400).json({ success: false, message: 'Invalid postId' });
        }

        const reel= await Reels.findById(reelId);
        if (!reel) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        res.status(200).json({ success: true, comments: reel.comments });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'An unexpected error has occurred, try again!' });
    }
});


router.get('/getReel/:reelId', async (req, res) => {
    try {
        const postId = req.params.postId;
        const post = await Reels.findById(postId);
        if (!post) {
            return res.status(404).json({success: false, message: 'Post not found'});
        }
        res.json(post);
    } catch (error) {
        console.error(error);
        res.status(500).json({success: false, message: 'An unexpected error has occurred, try again!'});
    }
});
router.get('/getListReel', async (req, res) => {
        try {
            const posts = await Reels.find();
            res.json(posts);
        } catch (error) {
            console.error(error);
            res.status(500).json({message: 'Lỗi khi lấy dữ liệu người dùng!'});
        }
    }
);


router.post('/createReel', async (req, res) => {
    try {
        const {caption, videoUrl, userId, userName, userImageUrl} = req.body;

        if (!caption || !userId || !userName || !userImageUrl) {
            return res.status(400).json({
                success: false,
                message: 'Caption, userId, userName, and userImageUrl are required'
            });
        }

        const newPost = new Reels({
            caption,
            videoUrl: videoUrl || [],
            createdAt: new Date().toISOString(),
            likesCount: 0,
            commentsCount: 0,
            userId,
            userName,
            userImageUrl,
            isLiked: false,
            isOwnPost: true
        });

        await newPost.save();

        res.status(201).json({success: true, message: 'Post created successfully', post: newPost});
    } catch (error) {
        console.error(error);
        res.status(500).json({success: false, message: 'An unexpected error has occurred, try again!'});
    }
});
router.get('/getReelsByUser/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: 'Invalid userId' });
        }

        const reels = await Reels.find({ userId });
        if (!reels.length) {
            return res.status(404).json({ success: false, message: 'No reels found for this user' });
        }

        res.status(200).json({ success: true, reels });
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
