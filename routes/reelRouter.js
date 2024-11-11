const express = require('express');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const Reels = require('../Model/reel');

const router = express.Router();
const upload = multer({ dest: 'uploads/' }); // Directory for video uploads

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

// Route to create a reel
router.post('/createReel', upload.single('file'), async (req, res) => {
    try {
        let fileName = req.file ? req.file.filename : '';
        let reelData = req.body.reel_data ? JSON.parse(req.body.reel_data) : null;

        if (!reelData) {
            if (fileName) fs.unlinkSync(path.join('uploads/', fileName));
            return res.status(400).json({ success: false, message: 'Could not parse reel data' });
        }

        const videoUrl = `${req.protocol}://${req.get('host')}/uploads/${fileName}`;
        const newReel = new Reels({
            ...reelData,
            videoUrl,
            createdAt: new Date().toISOString(),
            likesCount: 0,
            commentsCount: 0,
            isLiked: false,
            isOwnPost: req.user && req.user.id === reelData.userId,
        });

        await newReel.save();
        res.status(201).json(newReel);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'An unexpected error has occurred, try again!' });
    }
});

// Route to get a specific reel by ID
router.get('/getReel/:reelId', async (req, res) => {
    try {
        const reelId = req.params.reelId;
        const reel = await Reels.findById(reelId);
        if (!reel) {
            return res.status(404).json({ success: false, message: 'Reel not found' });
        }
        res.json(reel);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'An unexpected error has occurred, try again!' });
    }
});

// Route to delete a specific reel by ID
router.delete('/deleteReel/:reelId', async (req, res) => {
    try {
        const reelId = req.params.reelId;
        const reel = await Reels.findByIdAndDelete(reelId);

        if (!reel) {
            return res.status(404).json({ success: false, message: 'Reel not found' });
        }

        const videoPath = path.join('uploads/', path.basename(reel.videoUrl));
        if (fs.existsSync(videoPath)) {
            fs.unlinkSync(videoPath);
        }

        res.json({ success: true, message: 'Reel deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'An unexpected error has occurred, try again!' });
    }
});

// Route to get reels feed
router.get('/getFeed', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 0;
        const limit = parseInt(req.query.limit) || 10;

        const reels = await Reels.find()
            .sort({ createdAt: -1 })
            .skip(page * limit)
            .limit(limit);

        res.json(reels);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'An unexpected error has occurred, try again!' });
    }
});

// Route to get reels by a specific user
router.get('/getUserReels/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const reels = await Reels.find({ userId })
            .sort({ createdAt: -1 });

        res.json(reels);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'An unexpected error has occurred, try again!' });
    }
});

module.exports = router;
