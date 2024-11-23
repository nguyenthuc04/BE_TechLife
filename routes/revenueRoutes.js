const express = require('express');
const router = express.Router();
const User = require('../Model/user');

router.get('/mentor-statistics', async (req, res) => {
    try {
        const mentors = await User.find({ accountType: 'mentor' });

        const totalMentors = mentors.length;
        const upgradePrice = 100000; // Giá nâng cấp lên tài khoản mentor
        const totalRevenue = totalMentors * upgradePrice;

        res.json({
            totalMentors,
            upgradePrice,
            totalRevenue,
            mentors: mentors.map(mentor => ({
                id: mentor._id,
                name: mentor.name,
                nickname: mentor.nickname
            }))
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


module.exports = router;

