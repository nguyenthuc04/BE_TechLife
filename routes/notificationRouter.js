const express = require('express');
const Notification = require('../Model/notification');
const mongoose = require('mongoose');
const router = express.Router();

// Get all notifications
router.get('/getListNotification', async (req, res) => {
    try {
        const notifications = await Notification.find();
        res.status(200).json({ success: true, notifications });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
    }
});

// Get notifications by userId
router.get('/getNotification/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: 'Invalid userId' });
        }

        const notifications = await Notification.find({ myID: userId });
        res.status(200).json({ success: true, notifications });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to fetch user notifications' });
    }
});

// Add a new notification
router.post('/addNotification', async (req, res) => {
    try {
        const {name, message, image, time, idPostReel, myID, yourID } = req.body;

        if (!name || !message || !time || !myID || !yourID) {
            return res.status(400).json({
                success: false,
                message: 'Required fields: name, message, time, myID, and yourID'
            });
        }

        const newNotification = new Notification({
            name,
            message,
            image: image || '', // Default to an empty string if no image is provided
            time,
            idPostReel: idPostReel || '', // Default to an empty string if no post/reel ID is provided
            myID,
            yourID
        });

        await newNotification.save();
        res.status(201).json({ success: true, message: 'Notification added successfully', notification: newNotification });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to add notification' });
    }
});

// Delete a notification by ID
router.delete('deleteNotification/:id', async (req, res) => {
    try {
        const { notificationId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(notificationId)) {
            return res.status(400).json({ success: false, message: 'Invalid notification ID' });
        }

        const deletedNotification = await Notification.findByIdAndDelete(notificationId);

        if (!deletedNotification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        res.status(200).json({ success: true, message: 'Notification deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to delete notification' });
    }
});

// Mark a notification as read
router.put('/:id/markAsRead', async (req, res) => {
    try {
        const { notificationId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(notificationId)) {
            return res.status(400).json({ success: false, message: 'Invalid notification ID' });
        }

        const notification = await Notification.findById(notificationId);
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        notification.read = true; // Assuming a `read` field exists in the Notification model
        await notification.save();

        res.status(200).json({ success: true, message: 'Notification marked as read', notification });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to mark notification as read' });
    }
});

module.exports = router;
