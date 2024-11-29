const express = require('express');
const Posts = require('../Model/post');
const mongoose = require('mongoose');
const router = express.Router();
const moment = require('moment-timezone');
const Notification = require('../Model/notification');


router.post('/likePost/:postId', async (req, res) => {
    try {
        const postId = req.params.postId;
        const { userId, imgUser, nameUser, yourID } = req.body;

        if (!mongoose.Types.ObjectId.isValid(postId) || !userId || !imgUser || !nameUser || !yourID ) {
            return res.status(400).json({ success: false, message: 'Invalid input data' });
        }

        const post = await Posts.findById(postId);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        const likeIndex = post.likes.indexOf(userId);
        if (likeIndex === -1) {
            post.likes.push(userId);
            post.likesCount += 1;

            // Create a new like notification
            const likeNotification = new Notification({
                contentId: postId,
                userId,
                imgUser,
                nameUser,
                yourID,
                read: false,
                processed: false,
                time: new Date().toISOString(),
                type: 'like',
                contentType: 'post'
            });
            await likeNotification.save();

            message = 'Post liked successfully';
        } else {
            post.likes.splice(likeIndex, 1);
            post.likesCount -= 1;
            message = 'Post unliked successfully';
        }

        await post.save();

        res.status(200).json({ success: true, message, post });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'An unexpected error has occurred, try again!' });
    }
});

router.post('/addComment/:postId', async (req, res) => {
    try {
        const postId = req.params.postId;
        const { userId, userName, userImageUrl, text, yourID } = req.body;

        if (!mongoose.Types.ObjectId.isValid(postId) || !userId || !userName || !userImageUrl || !text || !yourID ) {
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

        // Create a new comment notification
        const commentNotification = new Notification({
            contentId: postId,
            userId,
            imgUser: userImageUrl,
            nameUser: userName,
            yourID,
            read: false,
            processed: false,
            time: new Date().toISOString(),
            type: 'comment',
            contentType: 'post'
        });
        await commentNotification.save();

        await post.save();

        res.status(201).json({ success: true, message: 'Comment added successfully', post });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'An unexpected error has occurred, try again!' });
    }
});



router.get('/getComments/:postId', async (req, res) => {
    try {
        const postId = req.params.postId;

        if (!mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(400).json({success: false, message: 'Invalid postId'});
        }

        const post = await Posts.findById(postId);
        if (!post) {
            return res.status(404).json({success: false, message: 'Post not found'});
        }

        res.status(200).json({success: true, comments: post.comments});
    } catch (error) {
        console.error(error);
        res.status(500).json({success: false, message: 'An unexpected error has occurred, try again!'});
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





router.post('/createPost', async (req, res) => {
    try {
        const {caption, imageUrl, userId, userName, userImageUrl} = req.body;

        if (!caption || !userId || !userName || !userImageUrl) {
            return res.status(400).json({
                success: false,
                message: 'Caption, userId, userName, and userImageUrl are required'
            });
        }
        const vietnamTime = moment().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
        const newPost = new Posts({
            caption,
            imageUrl: imageUrl || [],
            createdAt: vietnamTime,
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
            return res.status(400).json({success: false, message: 'Invalid userId'});
        }

        const posts = await Posts.find({userId});
        if (!posts.length) {
            return res.status(404).json({success: false, message: 'No posts found for this user'});
        }

        res.status(200).json({success: true, posts});
    } catch (error) {
        console.error(error);
        res.status(500).json({success: false, message: 'An unexpected error has occurred, try again!'});
    }
});

// Delete Post
router.delete('/deletePost/:postId', async (req, res) => {
    try {
        const postId = req.params.postId;

        // Validate postId
        if (!mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(400).json({success: false, message: 'Invalid postId'});
        }

        // Check if the post exists
        const post = await Posts.findById(postId);
        if (!post) {
            return res.status(404).json({success: false, message: 'Post not found'});
        }

        // Optionally: Check if the user is authorized to delete the post
        // This can depend on your authentication middleware or logic
        // e.g., if (req.user.id !== post.userId.toString()) return res.status(403).json({ message: 'Unauthorized' });

        // Delete the post
        await Posts.findByIdAndDelete(postId);

        res.status(200).json({success: true, message: 'Post deleted successfully'});
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({success: false, message: 'An unexpected error occurred while deleting the post'});
    }
});

// Update Post
router.put('/updatePost/:postId', async (req, res) => {
    try {
        const postId = req.params.postId;
        const { caption } = req.body; // Only expect 'caption' to be updated

        // Validate postId
        if (!mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(400).json({ success: false, message: 'Invalid postId' });
        }

        // Find the post by postId
        const post = await Posts.findById(postId);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        // If caption is provided, update it
        if (caption !== undefined) {
            post.caption = caption;
        }

        // Save the updated post
        await post.save();

        res.status(200).json({ success: true, message: 'Post updated successfully', post });
    } catch (error) {
        console.error('Error updating post:', error);
        res.status(500).json({ success: false, message: 'An unexpected error occurred while updating the post' });
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
            return res.status(404).json({error: 'Không tìm thấy bài viết'});
        }

        // Kiểm tra xem bài viết đã được chấp nhận chưa
        const existingAcceptedPost = await AcceptedPost.findOne({postId});
        if (existingAcceptedPost) {
            return res.status(400).json({error: 'Bài viết đã được chấp nhận trước đó'});
        }

        // Tạo một bản ghi mới trong collection AcceptedPost
        const acceptedPost = new AcceptedPost({postId});
        await acceptedPost.save();

        res.status(200).json({message: 'Chấp nhận bài viết thành công', post});
    } catch (error) {
        res.status(500).json({error: 'Lỗi khi chấp nhận bài viết'});
    }
});

// Cập nhật API lấy danh sách bài viết để chỉ trả về các bài viết chưa được chấp nhận
router.get('/postsQT', async (req, res) => {
    try {
        const acceptedPostIds = await AcceptedPost.find().distinct('postId');
        const posts = await Posts.find({_id: {$nin: acceptedPostIds}});

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
        res.status(500).json({error: 'Lỗi khi lấy danh sách bài viết'});
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
        res.status(500).json({error: 'Lỗi khi lấy danh sách bài viết đã chấp nhận'});
    }
});

router.put('/postsQT/:id/unarchive', async (req, res) => {
    try {
        const postId = req.params.id;

        // Xóa bài viết khỏi danh sách đã chấp nhận
        await AcceptedPost.findOneAndDelete({postId: postId});

        // Lấy thông tin bài viết
        const post = await Posts.findById(postId);

        if (!post) {
            return res.status(404).json({success: false, message: 'Không tìm thấy bài viết'});
        }

        res.status(200).json({success: true, message: 'Bài viết đã được hủy lưu trữ', post: post});
    } catch (error) {
        console.error('Lỗi khi hủy lưu trữ bài viết:', error);
        res.status(500).json({success: false, error: 'Lỗi khi hủy lưu trữ bài viết'});
    }
});

// API xóa bài viết
router.delete('/postsQT/:id', async (req, res) => {
    try {
        const postId = req.params.id;
        const deletedPost = await Posts.findByIdAndDelete(postId);
        if (!deletedPost) {
            return res.status(404).json({error: 'Không tìm thấy bài viết'});
        }
        res.status(200).json({message: 'Xóa bài viết thành công'});
    } catch (error) {
        res.status(500).json({error: 'Lỗi khi xóa bài viết'});
    }
});
/////////////////////////////////
module.exports = router;
