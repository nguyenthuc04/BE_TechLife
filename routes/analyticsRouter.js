const express = require('express');
const router = express.Router();
const Users = require('../Model/user');
const Posts = require('../Model/post');
const Reels = require('../Model/reel');

// API lấy thống kê cho bài viết và reel
router.get('/statsPostReel', async (req, res) => {
    try {
        // Tính tổng số bài viết
        const totalPosts = await Posts.countDocuments();

        // Tính tổng số lượt thích cho bài viết
        const totalLikesPosts = await Posts.aggregate([
            { $group: { _id: null, totalLikes: { $sum: "$likesCount" } } }
        ]);

        // Tính tổng số bình luận cho bài viết
        const totalCommentsPosts = await Posts.aggregate([
            { $group: { _id: null, totalComments: { $sum: "$commentsCount" } } }
        ]);

        // Tính tổng số reel
        const totalReels = await Reels.countDocuments();

        // Tính tổng số lượt thích cho reel
        const totalLikesReels = await Reels.aggregate([
            { $group: { _id: null, totalLikes: { $sum: "$likesCount" } } }
        ]);

        // Tính tổng số bình luận cho reel
        const totalCommentsReels = await Reels.aggregate([
            { $group: { _id: null, totalComments: { $sum: "$commentsCount" } } }
        ]);

        // Gửi kết quả về frontend
        res.json({
            totalPosts,
            totalLikesPosts: totalLikesPosts[0]?.totalLikes || 0,
            totalCommentsPosts: totalCommentsPosts[0]?.totalComments || 0,
            totalReels,
            totalLikesReels: totalLikesReels[0]?.totalLikes || 0,
            totalCommentsReels: totalCommentsReels[0]?.totalComments || 0
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// API: Lấy người dùng hoạt động nhiều nhất
router.get('/most-active-users', async (req, res) => {
    try {
        const activeUsers = await Users.find({})
            .sort({ lastLog: -1 }) // Sắp xếp theo lần đăng nhập cuối cùng
            .limit(5)
            .select('name nickname avatar lastLog'); // Lấy trường cần thiết
        res.json(activeUsers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi lấy người dùng hoạt động nhiều nhất' });
    }
});

// API: Lấy bài viết được thích nhiều nhất
router.get('/most-liked-posts', async (req, res) => {
    try {
        const popularPosts = await Posts.find({})
            .sort({ likesCount: -1 }) // Sắp xếp theo số lượt thích giảm dần
            .limit(5)
            .select('caption likesCount userName userImageUrl'); // Lấy trường cần thiết
        res.json(popularPosts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi lấy bài viết được thích nhiều nhất' });
    }
});

module.exports = router;
