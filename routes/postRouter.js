const express = require('express');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const Posts = require('../Model/post');

const router = express.Router();
const upload = multer({ dest: 'uploads/' }); // Sử dụng đường dẫn cố định cho hình ảnh

// Middleware for authentication
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

// Route to create a post
router.post('/createPost', upload.single('file'), async (req, res) => {
    try {
        let fileName = req.file ? req.file.filename : '';
        let postTextParams = req.body.post_data ? JSON.parse(req.body.post_data) : null;

        if (!postTextParams) {
            if (fileName) fs.unlinkSync(path.join('uploads/', fileName));
            return res.status(400).json({ success: false, message: 'Could not parse post data' });
        }

        const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${fileName}`;
        const newPost = new Posts({
            ...postTextParams,
            imageUrl,
            createdAt: new Date().toISOString()
        });

        await newPost.save();
        res.status(201).json(newPost);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'An unexpected error has occurred, try again!' });
    }
});

// Route to get a specific post by ID
router.get('/getPost/:postId', async (req, res) => {
    try {
        const postId = req.params.postId;
        const post = await Posts.findById(postId);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }
        res.json(post);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'An unexpected error has occurred, try again!' });
    }
});

// Route to delete a specific post by ID
router.delete('/deletePost/:postId', async (req, res) => {
    try {
        const postId = req.params.postId;
        const post = await Posts.findByIdAndDelete(postId);

        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        // Xóa file hình ảnh khỏi hệ thống nếu tồn tại
        const imagePath = path.join('uploads/', path.basename(post.imageUrl));
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }

        res.json({ success: true, message: 'Post deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'An unexpected error has occurred, try again!' });
    }
});

// Route to get posts feed
router.get('/getFeed', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 0;
        const limit = parseInt(req.query.limit) || 10;

        const posts = await Posts.find()
            .sort({ createdAt: -1 })
            .skip(page * limit)
            .limit(limit);

        res.json(posts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'An unexpected error has occurred, try again!' });
    }
});

// Route to get posts by a specific user
router.get('/getUserPosts/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const posts = await Posts.find({ user_id: userId })
            .sort({ createdAt: -1 });

        res.json(posts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'An unexpected error has occurred, try again!' });
    }
});

module.exports = router;
