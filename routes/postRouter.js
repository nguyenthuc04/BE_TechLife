const express = require('express');
const jwt = require('jsonwebtoken');
const Posts = require('../Model/post');

const router = express.Router();

// Middleware for authentication
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

// Route to create a post
router.post('/createPost', async (req, res) => {
    try {
        let postTextParams;

        try {
            postTextParams = req.body.post_data ? JSON.parse(req.body.post_data) : null;
        } catch (error) {
            return res.status(400).json({ success: false, message: 'Could not parse post data' });
        }

        if (!postTextParams) {
            return res.status(400).json({ success: false, message: 'Post data is missing' });
        }

        // Get the image URL directly from the request
        const imageUrl = postTextParams.imageUrl || '';

        // Create new Post object with the provided image URL
        const newPost = new Posts({
            ...postTextParams,
            imageUrl,
            createdAt: new Date().toISOString(),
        });

        await newPost.save();
        res.status(201).json(newPost);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'An unexpected error has occurred, try again!' });
    }
});

// Route to update a specific post by ID
router.put('/updatePost/:postId', async (req, res) => {
    try {
        const postId = req.params.postId;
        const updatedData = req.body.post_data ? JSON.parse(req.body.post_data) : null;

        if (!updatedData) {
            return res.status(400).json({ success: false, message: 'Post data is missing' });
        }

        // Check if the post exists
        const post = await Posts.findById(postId);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        // Update post fields with the new data
        post.caption = updatedData.caption || post.caption;
        post.imageUrl = updatedData.imageUrl || post.imageUrl;
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

// Route to delete a specific post by ID
router.delete('/deletePost/:postId', async (req, res) => {
    try {
        const postId = req.params.postId;

        // Check if the post exists
        const post = await Posts.findById(postId);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        // Delete the post
        await post.remove();

        res.json({ success: true, message: 'Post deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'An unexpected error has occurred, try again!' });
    }
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// API lấy danh sách bài viết
router.get('/api/posts', async (req, res) => {
    try {
        const posts = await Posts.find();

        // Nếu bạn muốn xử lý thêm dữ liệu, ví dụ kiểm tra imageUrl
        const processedPosts = posts.map(post => {
            // Kiểm tra nếu post có imageUrl là mảng và đảm bảo nó có ảnh
            if (Array.isArray(post.imageUrl) && post.imageUrl.length > 0) {
                post.imageUrl = post.imageUrl.map(url => url); // Xử lý hoặc điều chỉnh mảng ảnh nếu cần
            } else {
                post.imageUrl = []; // Nếu không có ảnh, trả về mảng rỗng
            }

            return post;
        });

        res.status(200).json(processedPosts);
    } catch (error) {
        res.status(500).json({ error: 'Lỗi khi lấy danh sách bài viết' });
    }
});

// API xóa bài viết
router.delete('/api/posts/:id', async (req, res) => {
    try {
        const postId = req.params.id;
        const deletedPost = await Posts.findByIdAndDelete(postId);
        if (!deletedPost) {
            return res.status(404).json({ error: 'Không tìm thấy bài viết' });
        }
        res.status(200).json({ message: 'Xóa bài viết thành công' });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi khi xóa bài viết' });
    }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////
module.exports = router;
