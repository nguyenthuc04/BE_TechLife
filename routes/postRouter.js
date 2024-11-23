const express = require('express');
const Posts = require('../Model/post');
const mongoose = require('mongoose');
const router = express.Router();

router.get('/getComments/:postId', async (req, res) => {
    try {
        const postId = req.params.postId;

        if (!mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(400).json({ success: false, message: 'Invalid postId' });
        }

        const post = await Posts.findById(postId);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        res.status(200).json({ success: true, comments: post.comments });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'An unexpected error has occurred, try again!' });
    }
});

router.post('/addComment/:postId', async (req, res) => {
    try {
        const postId = req.params.postId;
        const { userId, userName, userImageUrl, text } = req.body;

        if (!mongoose.Types.ObjectId.isValid(postId) || !userId || !userName || !userImageUrl || !text) {
            return res.status(400).json({ success: false, message: 'Invalid input data' });
        }

        const post = await Posts.findById(postId);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        const newComment = {
            userId,
            userName,
            userImageUrl,
            text,
            createdAt: new Date()
        };

        post.comments.push(newComment);
        post.commentsCount += 1;

        await post.save();

        res.status(201).json({ success: true, message: 'Comment added successfully', post });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'An unexpected error has occurred, try again!' });
    }
});

router.get('/getPost/:postId', async (req, res) => {
    try {
        const postId = req.params.postId;
        const post = await Posts.findById(postId);
        if (!post) {
            return res.status(404).json({success: false, message: 'Post not found'});
        }
        res.json(post);
    } catch (error) {
        console.error(error);
        res.status(500).json({success: false, message: 'An unexpected error has occurred, try again!'});
    }
});
router.get('/getListPost', async (req, res) => {
        try {
            const posts = await Posts.find();
            res.json(posts);
        } catch (error) {
            console.error(error);
            res.status(500).json({message: 'Lỗi khi lấy dữ liệu người dùng!'});
        }
    }
);

router.post('/likePost/:postId', async (req, res) => {
    try {
        const postId = req.params.postId;
        const userId = req.body.userId;

        if (!mongoose.Types.ObjectId.isValid(postId) || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({success: false, message: 'Invalid postId or userId'});
        }

        const post = await Posts.findById(postId);
        if (!post) {
            return res.status(404).json({success: false, message: 'Post not found'});
        }

        const likeIndex = post.likes.indexOf(userId);
        if (likeIndex === -1) {
            post.likes.push(userId);
            post.likesCount += 1;
            message = 'Post liked successfully';
        } else {
            post.likes.splice(likeIndex, 1);
            post.likesCount -= 1;
            message = 'Post unliked successfully';
        }

        await post.save();

        res.status(200).json({success: true, message, post});
    } catch (error) {
        console.error(error);
        res.status(500).json({success: false, message: 'An unexpected error has occurred, try again!'});
    }
});

router.post('/createPost', async (req, res) => {
    try {
        const {caption, imageUrl, userId, userName, userImageUrl} = req.body;

        if (!caption || !userId || !userName || !userImageUrl) {
            return res.status(400).json({
                success: false,
                message: 'Caption, userId, userName, and userImageUrl are required'
            });
        }

        const newPost = new Posts({
            caption,
            imageUrl: imageUrl || [],
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

router.get('/getPostsByUser/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: 'Invalid userId' });
        }

        const posts = await Posts.find({ userId });
        if (!posts.length) {
            return res.status(404).json({ success: false, message: 'No posts found for this user' });
        }

        res.status(200).json({ success: true, posts });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'An unexpected error has occurred, try again!' });
    }
});


module.exports = router;
