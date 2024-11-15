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

module.exports = router;
