const express = require('express');
const Users = require('../Model/user');
const router = express.Router();

// API endpoint to get the mentor leaderboard
router.get('/leaderboard', async (req, res) => {
    try {
        const mentors = await Users.find({ accountType: 'mentor' });
        const sortedMentors = mentors.sort((a, b) => b.followers.length - a.followers.length);
        res.json(sortedMentors);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch mentor leaderboard' });
    }
});

module.exports = router;