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

// router.use(authenticate); // Temporarily disable authentication middleware

// Route to create a post
router.post('/createPost', upload.single('file'), async (req, res) => {
    try {
        let fileName = req.file ? req.file.filename : '';
        let postTextParams;

        try {
            postTextParams = req.body.post_data ? JSON.parse(req.body.post_data) : null;
        } catch (error) {
            if (fileName) fs.unlinkSync(path.join('uploads/', fileName));
            return res.status(400).json({ success: false, message: 'Could not parse post data' });
        }

        if (!postTextParams) {
            if (fileName) fs.unlinkSync(path.join('uploads/', fileName));
            return res.status(400).json({ success: false, message: 'Post data is missing' });
        }

        const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${fileName}`;
        const newPost = new PostModel({
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

// Route to update a specific post by ID
router.put('/updatePost/:postId', upload.single('file'), async (req, res) => {
    try {
        const postId = req.params.postId;
        const updatedData = req.body.post_data ? JSON.parse(req.body.post_data) : null;

        if (!updatedData) {
            return res.status(400).json({ success: false, message: 'Post data is missing' });
        }

        // Check if the post exists
        const post = await PostModel.findById(postId);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        // If a new file is uploaded, delete the old one and update the image URL
        let imageUrl = post.imageUrl;
        if (req.file) {
            const oldImagePath = path.join('uploads/', path.basename(post.imageUrl));
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath); // Delete old image
            }
            imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`; // New image URL
        }

        // Update post fields and save
        post.caption = updatedData.caption || post.caption;
        post.imageUrl = imageUrl;
        post.likesCount = updatedData.likesCount || post.likesCount;
        post.commentsCount = updatedData.commentsCount || post.commentsCount;
        post.isLiked = updatedData.isLiked || post.isLiked;
        post.isOwnPost = updatedData.isOwnPost || post.isOwnPost;
        post.userName = updatedData.userName || post.userName;
        post.userImageUrl = updatedData.userImageUrl || post.userImageUrl;

        await post.save();

        res.json({ success: true, message: 'Post updated successfully', post });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'An unexpected error has occurred, try again!' });
    }
});


// Route to get a specific post by ID
router.get('/getPost/:postId', async (req, res) => {
    try {
        const postId = req.params.postId;
        const post = await PostModel.findById(postId);
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
        const post = await PostModel.findByIdAndDelete(postId);

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

// Route to get posts by a specific user
router.get('/getUserPosts/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const posts = await PostModel.find({ userId: userId }).sort({ createdAt: -1 });

        res.json(posts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'An unexpected error has occurred, try again!' });
    }
});

module.exports = router;

