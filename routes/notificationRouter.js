const express = require('express');
const Notification = require('../Model/notification');
const mongoose = require('mongoose');
const router = express.Router();

router.put('/updateNotificationRead/:notificationId', async (req, res) => {
    try {
        const notificationId = req.params.notificationId;

        if (!mongoose.Types.ObjectId.isValid(notificationId)) {
            return res.status(400).json({ success: false, message: 'Invalid notificationId' });
        }

        const notification = await Notification.findById(notificationId);
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        notification.read = true;

        await notification.save();

        res.status(200).json({ success: true, message: 'Notification updated successfully', notification });
    } catch (error) {
        console.error('Error updating notification:', error);
        res.status(500).json({ success: false, message: 'An unexpected error has occurred, try again!' });
    }
});

router.put('/updateNotificationProcessed/:notificationId', async (req, res) => {
    try {
        const notificationId = req.params.notificationId;

        if (!mongoose.Types.ObjectId.isValid(notificationId)) {
            return res.status(400).json({ success: false, message: 'Invalid notificationId' });
        }

        const notification = await Notification.findById(notificationId);
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        notification.processed = true;

        await notification.save();

        res.status(200).json({ success: true, message: 'Notification updated successfully', notification });
    } catch (error) {
        console.error('Error updating notification:', error);
        res.status(500).json({ success: false, message: 'An unexpected error has occurred, try again!' });
    }
});

router.get('/getNotifications/:yourID', async (req, res) => {
    try {
        const yourID = req.params.yourID;

        if (!mongoose.Types.ObjectId.isValid(yourID)) {
            return res.status(400).json({ success: false, message: 'Invalid yourID' });
        }

        const notifications = await Notification.find({ yourID }).sort({ createdAt: -1 });

        res.status(200).json({ success: true,notifications: notifications });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'An unexpected error has occurred, try again!' });
    }
});

module.exports = router;
