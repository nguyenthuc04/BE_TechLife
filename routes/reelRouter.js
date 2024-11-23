const express = require('express');
const jwt = require('jsonwebtoken');
const Reels = require('../Model/reel');
const mongoose = require("mongoose");

const router = express.Router();

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

router.post('/addReelComment/:reelId', async (req, res) => {
    try {
        const reelId = req.params.reelId;
        const { userId, userName, userImageUrl, text } = req.body;

        if (!mongoose.Types.ObjectId.isValid(reelId) || !userId || !userName || !userImageUrl || !text) {
            return res.status(400).json({ success: false, message: 'Invalid input data' });
        }

        const reel = await Reels.findById(reelId);
        if (!reel) {
            return res.status(404).json({ success: false, message: 'Post not found' });
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

        await reel.save();

        res.status(201).json({ success: true, message: 'Comment added successfully', reel });
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

router.post('/likeReel/:reelId', async (req, res) => {
    try {
        const reelId = req.params.reelId;
        const userId = req.body.userId;

        if (!mongoose.Types.ObjectId.isValid(reelId) || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({success: false, message: 'Invalid postId or userId'});
        }

        const reel = await Reels.findById(reelId);
        if (!reel) {
            return res.status(404).json({success: false, message: 'Post not found'});
        }

        const likeIndex = reel.likes.indexOf(userId);
        if (likeIndex === -1) {
            reel.likes.push(userId);
            reel.likesCount += 1;
            message = 'Post liked successfully';
        } else {
            reel.likes.splice(likeIndex, 1);
            reel.likesCount -= 1;
            message = 'Post unliked successfully';
        }

        await reel.save();

        res.status(200).json({success: true, message, reel});
    } catch (error) {
        console.error(error);
        res.status(500).json({success: false, message: 'An unexpected error has occurred, try again!'});
    }
});

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
module.exports = router;
