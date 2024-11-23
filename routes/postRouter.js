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
const AcceptedPost = require('../Model/acceptedPost');
// API chấp nhận bài viết
router.put('/postsQT/:id/accept', async (req, res) => {
    try {
        const postId = req.params.id;
        const post = await Posts.findById(postId);
        if (!post) {
            return res.status(404).json({ error: 'Không tìm thấy bài viết' });
        }

        // Kiểm tra xem bài viết đã được chấp nhận chưa
        const existingAcceptedPost = await AcceptedPost.findOne({ postId });
        if (existingAcceptedPost) {
            return res.status(400).json({ error: 'Bài viết đã được chấp nhận trước đó' });
        }

        // Tạo một bản ghi mới trong collection AcceptedPost
        const acceptedPost = new AcceptedPost({ postId });
        await acceptedPost.save();

        res.status(200).json({ message: 'Chấp nhận bài viết thành công', post });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi khi chấp nhận bài viết' });
    }
});

// Cập nhật API lấy danh sách bài viết để chỉ trả về các bài viết chưa được chấp nhận
router.get('/postsQT', async (req, res) => {
    try {
        const acceptedPostIds = await AcceptedPost.find().distinct('postId');
        const posts = await Posts.find({ _id: { $nin: acceptedPostIds } });

        const processedPosts = posts.map(post => {
            if (Array.isArray(post.imageUrl) && post.imageUrl.length > 0) {
                post.imageUrl = post.imageUrl.map(url => url);
            } else {
                post.imageUrl = [];
            }
            return post;
        });

        res.status(200).json(processedPosts);
    } catch (error) {
        res.status(500).json({ error: 'Lỗi khi lấy danh sách bài viết' });
    }
});

router.get('/postsQT/accepted', async (req, res) => {
    try {
        const acceptedPosts = await AcceptedPost.find().populate('postId');
        const processedPosts = acceptedPosts.map(acceptedPost => {
            const post = acceptedPost.postId;
            return {
                ...post.toObject(),
                acceptedAt: acceptedPost.acceptedAt
            };
        });
        res.status(200).json(processedPosts);
    } catch (error) {
        console.error('Lỗi khi lấy danh sách bài viết đã chấp nhận:', error);
        res.status(500).json({ error: 'Lỗi khi lấy danh sách bài viết đã chấp nhận' });
    }
});

router.put('/postsQT/:id/unarchive', async (req, res) => {
    try {
        const postId = req.params.id;

        // Xóa bài viết khỏi danh sách đã chấp nhận
        await AcceptedPost.findOneAndDelete({ postId: postId });

        // Lấy thông tin bài viết
        const post = await Posts.findById(postId);

        if (!post) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
        }

        res.status(200).json({ success: true, message: 'Bài viết đã được hủy lưu trữ', post: post });
    } catch (error) {
        console.error('Lỗi khi hủy lưu trữ bài viết:', error);
        res.status(500).json({ success: false, error: 'Lỗi khi hủy lưu trữ bài viết' });
    }
});

// API xóa bài viết
router.delete('/postsQT/:id', async (req, res) => {
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
